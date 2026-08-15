import { useMemo } from "react";
import { fieldCls } from "@/lib/profile-options";

type Country = {
  code: string;
  dial: string;
  flag: string;
  name: string;
};

export const COUNTRIES: Country[] = [
  { code: "BR", dial: "55", flag: "🇧🇷", name: "Brasil" },
  { code: "PT", dial: "351", flag: "🇵🇹", name: "Portugal" },
  { code: "US", dial: "1", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "AR", dial: "54", flag: "🇦🇷", name: "Argentina" },
  { code: "PY", dial: "595", flag: "🇵🇾", name: "Paraguai" },
  { code: "UY", dial: "598", flag: "🇺🇾", name: "Uruguai" },
  { code: "CL", dial: "56", flag: "🇨🇱", name: "Chile" },
  { code: "CO", dial: "57", flag: "🇨🇴", name: "Colômbia" },
  { code: "MX", dial: "52", flag: "🇲🇽", name: "México" },
  { code: "ES", dial: "34", flag: "🇪🇸", name: "Espanha" },
  { code: "GB", dial: "44", flag: "🇬🇧", name: "Reino Unido" },
];

const DEFAULT = COUNTRIES[0]!;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** Splits a stored value (ideally E.164) into country + national digits. */
export function parsePhone(value: string | null | undefined) {
  const digits = digitsOnly(value ?? "");
  if (!digits) return { country: DEFAULT, national: "" };

  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const match = sorted.find((c) => digits.startsWith(c.dial));
  if (match) {
    return { country: match, national: digits.slice(match.dial.length) };
  }
  // Legacy values saved without country code: assume Brazil.
  return { country: DEFAULT, national: digits };
}

/** Pretty national formatting (BR-aware, generic grouping otherwise). */
export function formatNational(country: Country, national: string) {
  const d = digitsOnly(national);
  if (country.code === "BR") {
    if (d.length <= 2) return d;
    const ddd = d.slice(0, 2);
    const rest = d.slice(2, 11);
    if (rest.length <= 4) return `(${ddd}) ${rest}`;
    if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  }
  if (country.code === "US") {
    const x = d.slice(0, 10);
    if (x.length <= 3) return x;
    if (x.length <= 6) return `(${x.slice(0, 3)}) ${x.slice(3)}`;
    return `(${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}`;
  }
  return d.slice(0, 14).replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

/** Human readable full number, e.g. +55 (66) 99999-1234 */
export function formatPhoneDisplay(value: string | null | undefined) {
  if (!value) return "";
  const { country, national } = parsePhone(value);
  if (!national) return `+${country.dial}`;
  return `+${country.dial} ${formatNational(country, national)}`;
}

/** E.164 value to store, e.g. +5566999991234 */
function toE164(country: Country, national: string) {
  const d = digitsOnly(national);
  return d ? `+${country.dial}${d}` : "";
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "(66) 99999-9999",
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const { country, national } = useMemo(() => parsePhone(value), [value]);

  return (
    <div className="flex items-stretch gap-2">
      <div className="relative shrink-0">
        <select
          aria-label="País"
          className={`${fieldCls} w-[7.25rem] appearance-none pr-7`}
          value={country.code}
          onChange={(e) => {
            const next =
              COUNTRIES.find((c) => c.code === e.target.value) ?? DEFAULT;
            onChange(toE164(next, national));
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} +{c.dial}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          ▾
        </span>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={`${fieldCls} min-w-0 flex-1`}
        placeholder={placeholder}
        value={formatNational(country, national)}
        onChange={(e) => {
          const raw = e.target.value;
          // Allow typing a full international number directly (+55 ...).
          if (raw.trim().startsWith("+")) {
            const parsed = parsePhone(raw);
            onChange(toE164(parsed.country, parsed.national));
            return;
          }
          onChange(toE164(country, digitsOnly(raw)));
        }}
      />
    </div>
  );
}
