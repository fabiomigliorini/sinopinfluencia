import type { ComponentType } from "react";
import {
  SiFacebook,
  SiInstagram,
  SiKuaishou,
  SiLinkedin,
  SiTiktok,
  SiX,
  SiYoutube,
} from "react-icons/si";

export type NetworkId =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "linkedin"
  | "kwai"
  | "twitter";

export type NetworkMeta = {
  id: NetworkId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** Brand color kept inline on purpose: these are third-party logos. */
  color: string;
  placeholder: string;
  hint: string;
  auto: boolean;
};

export const NETWORK_META: Record<NetworkId, NetworkMeta> = {
  instagram: {
    id: "instagram",
    label: "Instagram",
    Icon: SiInstagram,
    color: "#E1306C",
    placeholder: "seuperfil",
    hint: "O perfil precisa ser público.",
    auto: true,
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    Icon: SiTiktok,
    color: "#111827",
    placeholder: "seuperfil",
    hint: "Somente perfis públicos.",
    auto: true,
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    Icon: SiYoutube,
    color: "#FF0000",
    placeholder: "@seucanal ou ID do canal",
    hint: "Inscritos e visualizações pela API oficial.",
    auto: true,
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    Icon: SiFacebook,
    color: "#1877F2",
    placeholder: "suapagina",
    hint: "Funciona com páginas, não com perfis pessoais.",
    auto: true,
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    Icon: SiLinkedin,
    color: "#0A66C2",
    placeholder: "in/seunome ou company/suaempresa",
    hint: "O LinkedIn bloqueia coleta pública: o número é informado por você.",
    auto: false,
  },
  kwai: {
    id: "kwai",
    label: "Kwai",
    Icon: SiKuaishou,
    color: "#FF7A00",
    placeholder: "seuperfil",
    hint: "Número informado por você.",
    auto: false,
  },
  twitter: {
    id: "twitter",
    label: "X (Twitter)",
    Icon: SiX,
    color: "#111827",
    placeholder: "seuperfil",
    hint: "Número informado por você.",
    auto: false,
  },
};

export const NETWORK_ORDER: NetworkId[] = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "linkedin",
  "kwai",
  "twitter",
];

export function NetworkBadge({
  network,
  className = "h-9 w-9",
  iconClassName = "h-4 w-4",
}: {
  network: string;
  className?: string;
  iconClassName?: string;
}) {
  const meta = NETWORK_META[network as NetworkId] ?? NETWORK_META.instagram;
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-white ${className}`}
      style={{ backgroundColor: meta.color }}
      aria-hidden="true"
    >
      <Icon className={iconClassName} />
    </span>
  );
}

export function networkLabel(network: string) {
  return NETWORK_META[network as NetworkId]?.label ?? network;
}
