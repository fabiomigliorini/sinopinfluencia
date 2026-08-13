# Redes sociais: várias contas por rede, wizard de vínculo e cards

## LinkedIn — o que é possível

O LinkedIn não expõe seguidores/publicações de forma pública: páginas de perfil exigem login e bloqueiam leitura automática, e a API oficial só devolve dados de quem autoriza o próprio login (com app aprovado pela Microsoft).

Proposta: incluir o LinkedIn na lista de redes, mas como **rede declarada** — o criador informa o link/@ e o número de seguidores manualmente, e o perfil público mostra "Declarado pelo criador". Se no futuro quisermos números verificados, aí sim entramos no processo de app oficial do LinkedIn.

Mesma regra vale para Kwai e X (sem coleta confiável hoje).

## Vários @ na mesma rede

Hoje o banco só aceita uma conta por rede e uma métrica por rede. Vamos permitir várias contas por rede (ex.: dois Instagram), cada uma com seus próprios números e histórico. Na vitrine pública, cada rede soma/exibe as contas vinculadas, com o @ ao lado de cada número.

## Wizard de vínculo (dialog em 3 passos)

Botão "Vincular nova rede" abre um dialog:

1. **Escolher a rede** — grade de opções com o logotipo de cada rede (Instagram, TikTok, YouTube, Facebook, LinkedIn, Kwai, X). Redes sem coleta automática aparecem marcadas como "número declarado".
2. **Informar o @** — campo com o @ ou o link do perfil, dica específica da rede, botão "Buscar dados".
3. **Confirmar** — mostra o que foi coletado (seguidores, publicações, curtidas/visualizações, foto do perfil). Se a coleta falhar, o passo abre um campo para o criador digitar os seguidores manualmente (marcado como declarado). Ao confirmar, o dialog fecha e a listagem é atualizada.

O mesmo wizard serve para editar uma conta já vinculada (reabre no passo 2 com o @ preenchido).

## Listagem em cards

Cada conta vinculada vira um card com:
- Logotipo da rede + foto de perfil coletada (quando existir).
- @ da conta, com link para o perfil na rede.
- Seguidores, publicações e curtidas/visualizações.
- Etiqueta "Dados públicos · data" ou "Declarado pelo criador".
- Ações: "Atualizar agora", "Editar @", "Remover".

## Foto de perfil da rede

Conseguimos a foto pública na maioria dos casos:
- Instagram: foto do perfil no endpoint público / imagem do preview.
- TikTok e Facebook: imagem do preview público da página.
- YouTube: miniatura oficial do canal via API.
- LinkedIn/Kwai/X: normalmente não — o card mostra só o logotipo da rede.

Como as redes bloqueiam o uso direto da imagem em outro site, a foto coletada é copiada para o armazenamento do projeto e servida pela nossa rota de imagens (mesma usada hoje no avatar). A foto do perfil da vitrine continua sendo a que o criador subiu; a foto da rede aparece apenas no card da conta.

## Detalhes técnicos

- Migração: trocar `social_accounts.unique(profile_id, network)` por `unique(profile_id, network, handle)`; adicionar `avatar_url`, `display_name`, `is_declared boolean default false` e `declared_followers text`; trocar `profile_metrics.unique(profile_id, network)` por `unique(profile_id, network, handle)` e adicionar coluna `handle` (mantendo os registros atuais).
- `social.server.ts`: coletores passam a devolver também `avatarUrl`/`displayName`; nova função baixa a imagem e grava no bucket `profile-images` (`social/<accountId>.jpg`); `syncSocialAccount` grava por conta e atualiza a métrica correspondente ao par rede+@.
- `social.functions.ts`: `addNetworkAccount`, `previewNetworkHandle` (busca sem salvar, usada no passo 2 do wizard), `confirmNetworkAccount`, `setDeclaredFollowers(accountId)`, `removeMyAccount` já existente; admin ganha as mesmas ações por conta.
- Novo `src/components/SocialAccountWizard.tsx` (dialog shadcn com passos) e `src/components/SocialAccountCards.tsx`; `SocialConnections.tsx` passa a orquestrar cards + wizard em vez do formulário por rede.
- Logotipos das redes: ícones SVG inline no código (sem binários), com cor da marca.
- `$slug.tsx`: métricas agrupadas por rede, listando cada @ e a origem (público/declarado).
- Cron diário e ações do painel de curadoria passam a iterar por conta.
