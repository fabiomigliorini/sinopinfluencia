import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

type Props = {
  file: File | null;
  imageSrc: string | null;
  aspect: number;
  round?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

async function cropToFile(
  imageSrc: string,
  area: Area,
  rotation: number,
  fileName: string,
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const boxW = image.width * cos + image.height * sin;
  const boxH = image.width * sin + image.height * cos;

  const rotated = document.createElement("canvas");
  rotated.width = Math.round(boxW);
  rotated.height = Math.round(boxH);
  const rctx = rotated.getContext("2d");
  if (!rctx) throw new Error("Não foi possível processar a imagem");
  rctx.translate(boxW / 2, boxH / 2);
  rctx.rotate(rad);
  rctx.drawImage(image, -image.width / 2, -image.height / 2);

  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    rotated,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("Não foi possível processar a imagem");
  const base = fileName.replace(/\.[^.]+$/, "") || "imagem";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}


export function ImageCropDialog({
  file,
  imageSrc,
  aspect,
  round = false,
  onCancel,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  const open = Boolean(imageSrc && file);

  async function confirm() {
    if (!imageSrc || !file || !area) return;
    setBusy(true);
    try {
      onConfirm(await cropToFile(imageSrc, area, rotation, file.name));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajustar imagem</DialogTitle>
          <DialogDescription>
            Arraste para reposicionar e use o zoom para enquadrar.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-foreground/90">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={round ? "round" : "rect"}
              showGrid={!round}
              restrictPosition
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Zoom
            </span>
            <Slider
              value={[zoom]}
              min={1}
              max={4}
              step={0.01}
              onValueChange={(v) => setZoom(v[0] ?? 1)}
            />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Rotação
            </span>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={(v) => setRotation(v[0] ?? 0)}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm font-bold transition hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy || !area}
            onClick={() => void confirm()}
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100"
          >
            {busy ? "Processando..." : "Usar imagem"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
