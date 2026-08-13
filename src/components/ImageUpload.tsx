import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  round?: boolean;
};

export function ImageUpload({ value, onChange, label = "Imagem", round = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("A imagem deve ter no máximo 5 MB");
      return;
    }

    setUploading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Sessão expirada, entre novamente");

      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${userData.user.id}/${crypto.randomUUID()}.${ext || "jpg"}`;
      const { error } = await supabase.storage
        .from("profile-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);

      onChange(`/api/public/img/${path}`);
      toast.success("Imagem enviada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no envio");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <div
          className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden border border-border bg-accent ${
            round ? "rounded-full" : "rounded-2xl"
          }`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="text-xs text-muted-foreground">sem foto</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold transition hover:bg-accent disabled:opacity-60"
          >
            {uploading ? "Enviando..." : value ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full border border-border px-4 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10"
            >
              Remover
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
