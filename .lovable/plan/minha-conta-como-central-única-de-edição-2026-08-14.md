# Minha Conta como central única de edição

Tudo passa a ser editado no dashboard "Minha conta", em cards que mostram os dados salvos com um botão "Editar" que abre um popup.

## Cards em Minha Conta

1. **Informações básicas** — card mostra nome público, nome completo, nicho, cidade, rede principal, WhatsApp, e-mail e bio. Botão "Editar" abre popup com o formulário principal (o mesmo de hoje) e salva na hora.
2. **Foto de perfil** — já existe, mantém.
3. **Perfis em redes sociais** — já existe, mantém.
4. **Formatos de trabalho** — card com os formatos escolhidos como badges; "Editar" abre popup com as opções selecionáveis.
5. **Marcas com quem já trabalhou** — um badge por marca, com "x" para excluir; botão "Adicionar marca" abre popup com um campo de nome. Fim do campo separado por vírgula.
6. **Portfólio** — lista em cards, um por trabalho: imagem/preview, título, descrição e o link do post. Botões "Adicionar trabalho" e, em cada card, "Editar" e "Remover" (via popup).

A página `/perfil/edit` deixa de existir como formulário longo; o link "Editar perfil" abre o popup de informações básicas. A rota é removida e qualquer link antigo passa a apontar para o dashboard.

## Portfólio com link do post

- Cada trabalho ganha um campo **URL do post** (Reel do Instagram, TikTok, Facebook, YouTube).
- Ao colar a URL, tentamos importar automaticamente a imagem de capa e o título do post (leitura dos metadados públicos da página). Se conseguir, o preview aparece no card; se não, o criador pode enviar a imagem manualmente como hoje.
- No card, a imagem/preview é clicável e abre o post original em nova aba.
- O mesmo preview e link aparecem no perfil público e na pré-visualização da curadoria.

## Detalhes técnicos

- Migração: adicionar `link_url text` em `public.profile_works` (opcional, nullable).
- Novos server functions em `src/lib/account.functions.ts` para edições parciais autenticadas: `updateMyBasics`, `setMyFormats`, `addMyBrand`, `removeMyBrand`, `upsertMyWork`, `removeMyWork` — todas com `requireSupabaseAuth` e validação Zod, evitando o payload monolítico atual de `updateMyProfile`.
- Nova server function `fetchLinkPreview` (pública, entrada validada, apenas hosts das redes suportadas) que baixa os metadados Open Graph da URL e devolve `{ title, image }`. A imagem é servida pelo proxy existente `/api/public/img` ou salva no bucket `profile-images` quando possível, evitando hotlink quebrado.
- Novos componentes: `src/components/account/BasicInfoDialog.tsx`, `FormatsDialog.tsx`, `BrandsCard.tsx`, `WorkDialog.tsx`, `PortfolioCard.tsx`, usando `Dialog` do shadcn já disponível em `src/components/ui`.
- `src/routes/_authenticated/dashboard.tsx` passa a montar os cards; `src/routes/_authenticated/perfil.edit.tsx` é removido.
- `src/components/ProfileView.tsx` e `src/routes/$slug.tsx` exibem os cards de portfólio com link e preview.
