# Métricas: manual verificada agora, integração paga só quando fizer sentido

Decisão que vou seguir: **não dependemos de fornecedor pago agora**. As métricas voltam a ser declaradas pelo criador, com um fluxo de verificação da ACES que dá credibilidade. O código da integração automática fica no projeto, desativado, pronto para ligar depois se você contratar a InsightIQ.

Esclarecimento importante: nenhuma API dá métricas de contas de terceiros sem autorização. O que existe é (a) o próprio criador autorizar a conta dele, ou (b) estimativas por dados públicos. Por isso o caminho honesto e sem custo hoje é manual + verificação.

## Como vai funcionar

1. Em **Editar meu perfil**, o criador informa seguidores/engajamento por rede e o @ de cada uma (como já é hoje).
2. Cada métrica ganha um estado: **Declarado** (padrão), **Verificado pela ACES** ou **Verificado via API** (quando/se a integração for ligada).
3. O criador pode anexar um **print do painel da rede** (mesma tela de upload já usada no portfólio) como comprovante.
4. No painel da ACES (**/admin/perfis**) aparece, por perfil, a lista de métricas com o comprovante ao lado e botões **Verificar** / **Recusar**. Verificar grava quem verificou e quando.
5. No perfil público e nos cards:
   - Verificado pela ACES → selo verde "Verificado pela ACES" + data.
   - Declarado → texto discreto "informado pelo criador".
   Nada de selo genérico que confunda os dois casos.
6. O bloco "Métricas automáticas" no editor passa a mostrar uma mensagem clara de que a importação automática está desativada, sem botão morto.

## O que fica pronto para o futuro

As tabelas `social_accounts` / `social_snapshots`, o cron e o webhook continuam existindo e desligados. Se um dia você contratar a InsightIQ, basta salvar as credenciais e o bloco de conexão volta a aparecer — sem refazer nada.

## Detalhes técnicos

**Banco (migração)**
- `profile_metrics`: adicionar `handle` (se ausente), `evidence_path text`, `verification_status text` default `declared` (`declared` | `verified` | `rejected`), `verified_at timestamptz`, `verified_by uuid`.
- Manter `source` (`manual` | `api`); o selo público passa a olhar `verification_status` + `source`.
- RLS: dono gerencia as próprias métricas; admin pode atualizar `verification_status`/`verified_*`; público lê métricas de perfis aprovados. GRANTs para `authenticated`, `anon` (select) e `service_role`.

**Servidor**
- `src/lib/account.functions.ts`: aceitar `handle` e `evidence_path` no update de métricas; nunca deixar o criador escrever `verification_status`.
- `src/lib/profiles.functions.ts` (admin): `setMetricVerification({ metricId, status })` com `assertAdmin`, gravando `verified_at` e `verified_by`.
- Comprovantes vão para o bucket privado `profile-images` (pasta `evidence/`), servidos pela rota de imagem já existente, visível só para dono e admin.

**Front**
- `perfil.edit.tsx`: campo de @ por rede + upload de comprovante por métrica; badge do estado atual.
- `SocialConnections.tsx`: estado "desativado" limpo, sem botão de conectar.
- `admin.perfis.tsx`: painel de verificação de métricas por perfil (comprovante, verificar, recusar).
- `$slug.tsx` e `ProfileCard.tsx`: selo "Verificado pela ACES" vs "informado pelo criador".

## Ordem de execução

1. Migração dos campos de verificação.
2. Editor: @ por rede + upload de comprovante.
3. Painel da ACES: verificar/recusar métricas.
4. Selos no perfil público e nos cards.
5. Desativar visualmente o bloco de conexão automática.
