# Criar páginas de apoio ao criador

## Objetivo
Adicionar duas páginas informativas ao projeto e expô-las no menu "Para criadores" do header, com textos-base que o usuário poderá editar depois.

## Escopo
1. **Nova rota `/academia`** — Página "Academia Sinop Influencia" com conteúdo introdutório sobre capacitação, dicas e recursos para criadores de conteúdo.
2. **Nova rota `/codigo-de-conduta`** — Página "Código de Conduta" com princípios-base de ética, transparência e boas práticas para participantes da vitrine.
3. **Atualizar o header** — O link "Sou influenciador" vira um menu suspenso/dropdown com as opções:
   - Cadastre seu perfil → `/auth` (ou `/dashboard` quando logado)
   - Academia Sinop Influencia → `/academia`
   - Código de conduta → `/codigo-de-conduta`

## Detalhes técnicos
- Criar `src/routes/academia.tsx` e `src/routes/codigo-de-conduta.tsx` usando `createFileRoute` com `head()` contendo título, descrição, OG e Twitter Cards.
- Usar o design system existente (tokens de cor, tipografia, cards) e manter a identidade visual verde/amarelo da marca.
- O texto será genérico/markup-placehold para ser substituído pelo usuário depois.
- O menu dropdown pode ser feito com `DropdownMenu` do shadcn já presente no projeto, ou com um grupo simples de links no mobile.
- A página `/academia` terá uma seção de destaque com cards de módulos (ex: Crie conteúdo de valor, Métricas que importam, Monetização local).
- A página `/codigo-de-conduta` terá uma lista de princípios (Transparência, Respeito, Veracidade, etc.) e um bloco de "Dúvidas?".

## Não inclui
- CMS ou edição inline dos textos (o usuário editará direto no código depois).
- Autenticação nessas páginas (serão públicas).
