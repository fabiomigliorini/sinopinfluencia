## Detalhes técnicos

Arquivo: `src/routes/__root.tsx`, função `Footer` (bloco da primeira coluna).

- Apagar o `<img>` solto (linha do logo sem `Link`), mantendo apenas o logo dentro do `<Link to="/">`.
- Cartão: `inline-flex items-center rounded-2xl bg-white px-5 py-4 shadow-lg shadow-black/20` no lugar de `bg-white/60 p-1`.
- Logo: `h-16 w-auto md:h-20` (maior que o atual em relação ao cartão, com padding real ao redor em vez de `p-1`).
- Texto abaixo: manter `mt-4` (agora sem o vão duplicado) e largura `max-w-[280px]`.
- Nenhuma mudança nos demais blocos do rodapé, nas rotas ou nos assets.
