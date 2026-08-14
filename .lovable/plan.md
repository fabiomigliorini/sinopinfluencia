# Curadoria: pré-visualização, redes e classificação por estrelas

Quatro ajustes no painel da ACES (`/admin/perfis`) e na exibição de níveis.

## 1. "Ver perfil" de um perfil em análise

Hoje o botão aponta para a página pública, que só carrega perfis aprovados — por isso cai em "Perfil indisponível".

Correção: criar uma pré-visualização de curadoria em `/admin/perfis/$id` (dentro da área autenticada) que mostra o mesmo layout do perfil público, mas lendo os dados via função autenticada de admin (funciona em rascunho, análise, rejeitado). O botão do card passa a abrir essa pré-visualização; para perfis já aprovados, mantém também um link "Abrir página pública".

## 2. Botão "Redes" mostra lista vazia

O painel de redes do admin hoje só tem o formulário de vínculo — nunca lista as contas já vinculadas (a função de leitura existe, mas não é usada na tela).

Correção: ao abrir "Redes", carregar as contas do perfil e mostrar, para cada uma: logo da rede, @, seguidores/últimas métricas, origem (dados públicos ou declarado) e botões de atualizar e remover. Formulário de novo @ continua abaixo. Estado vazio explícito: "Nenhuma rede vinculada".

## 3. Onde a curadoria define as estrelas

Hoje não existe nenhum controle de nível no painel — o nível fica sempre no valor padrão.

Correção: em cada card do painel, um seletor de nível (1 a 4 estrelas) que salva imediatamente, com aviso de confirmação. Salvamento por função de admin que valida o papel e registra o novo nível. O nível também aparece no card em análise para conferência.

## 4. Ordem correta das estrelas

Padronizar em todo o app (badge do card, perfil público, filtros do diretório, seletor do admin, ordenação das listagens):

```text
1 estrela  Criador
2 estrelas Referência
3 estrelas Ícone
4 estrelas Destaque
```

Listagens públicas passam a ordenar por essa ordem (4 → 1) em vez da ordem interna antiga do banco.

## Detalhes técnicos

- `src/components/ProfileCard.tsx`: corrigir `TIER_ORDER` para `creator:1, reference:2, icon:3, featured:4`; extrair o mapa para um módulo compartilhado (`src/lib/tiers.ts`) com label + rank, usado por diretório, home, admin e perfil.
- `src/lib/profiles.functions.ts`: substituir `.order("tier")` (ordem do enum no banco) por ordenação em JS pelo rank novo, mantendo nome como critério secundário.
- `src/lib/account.functions.ts`: nova server fn `setProfileTier` (admin, valida `has_role`) e `getProfileForAdmin(id)` retornando perfil + métricas/formatos/portfólio/marcas sem filtro de status.
- `src/routes/_authenticated/admin.perfis.$id.tsx`: nova rota de pré-visualização reutilizando a apresentação do perfil público (componente extraído de `src/routes/$slug.tsx`).
- `src/routes/_authenticated/admin.perfis.tsx`: em `AdminSocialTools`, usar `adminListAccounts` + `adminRemoveAccount` + `adminSyncProfile` para renderizar os cards de rede; adicionar o seletor de nível no card do perfil.
- Sem mudança de banco: o enum `tier` continua igual, só a ordem/rótulo de exibição muda.
