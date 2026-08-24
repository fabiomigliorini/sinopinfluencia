## Detalhes técnicos

- `src/routes/vitrine.tsx` (linha ~186): grid passa de `sm:grid-cols-2 lg:grid-cols-3` para `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`, com `gap-3 sm:gap-4 lg:gap-5`.
- `src/components/ProfileCard.tsx`:
  - remove `h-[520px]`; a foto usa `aspect-[3/4]` e o bloco de conteúdo fica no fluxo abaixo dela (mantendo `object-top`, sem cortar rosto).
  - raio do card `rounded-[20px] sm:rounded-[28px]`; padding do conteúdo `px-3 pb-3 pt-2.5 sm:px-5 sm:pb-5 sm:pt-4`.
  - nome `text-sm sm:text-lg`; cidade `text-[10px] sm:text-xs`.
  - tagline só a partir de `sm` (`hidden sm:block`), mantendo o clamp de 2 linhas.
  - nichos: 2 no mobile, 3 no desktop (extras viram `+N`); chips com fonte/padding menores no mobile.
  - selos de seguidores/tier reposicionados com `left-2 top-2 sm:left-4 sm:top-4` e tipografia reduzida no mobile.
  - `NetworkIconButton` ganha props de tamanho: `h-8 w-8` no mobile, `h-10 w-10` a partir de `sm`; máximo de 3 ícones no mobile e 4 no desktop.
- Contraste dos selos: no `ProfileCard`, o selo de seguidores e o `TierBadge light` trocam `bg-white/10` por um fundo escuro translúcido (`bg-[var(--brand-dark)]/70` + `backdrop-blur-xl` + `border-white/25`) e ganham `drop-shadow` leve no texto. O mesmo ajuste vale para os selos do `CreatorCarousel.tsx`.
- Hover `scale-[1.03]` e destaque amarelo da rede principal preservados.
- Sem mudanças em banco, filtros, ordenação ou nas demais páginas.

