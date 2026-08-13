# Métricas públicas das redes sociais

Trocar a integração paga (InsightIQ) por **coleta de dados públicos** a partir do @ do criador. Sem login do influenciador, sem custo mensal.

## O que passa a ser coletado

| Rede | Dados públicos | Como |
|---|---|---|
| YouTube | inscritos, visualizações totais, nº de vídeos | API oficial do YouTube (chave gratuita) |
| Instagram | seguidores, nº de publicações, foto/bio | leitura da página pública |
| TikTok | seguidores, curtidas totais, nº de vídeos | leitura da página pública |
| Facebook (página) | seguidores/curtidas da página | leitura da página pública |
| X / Kwai / LinkedIn | permanecem declarados | sem fonte pública confiável |

Não é possível obter alcance, impressões, stories ou dados de audiência sem autorização do dono — esses campos continuam fora do perfil.

## Como vai funcionar

1. No **/perfil/edit**, no lugar do bloco "Conectar rede social", o criador informa o **@ / URL** de cada rede.
2. Ao salvar, o sistema tenta buscar os números públicos na hora e mostra o resultado ("Instagram: 12.400 seguidores — atualizado agora").
3. Botão **Atualizar agora** por rede, além da **atualização diária automática** (rotina já existente de cron).
4. Se a coleta falhar (perfil privado, bloqueio da rede), o número declarado pelo criador é mantido e a rede fica marcada como "declarado", sem apagar dados.
5. No perfil público, cada métrica mostra a origem: **"Dados públicos · atualizado em 13/08"** ou **"Declarado pelo criador"**.
6. A ACES pode corrigir o @ e forçar uma atualização pelo painel de curadoria antes de aprovar.

## Decisões assumidas

- O criador informa os @; a ACES pode corrigir na curadoria.
- Coleta própria (sem fornecedor pago), com YouTube por API oficial.
- Selo mostra origem + data da coleta.

## Detalhes técnicos

- Reaproveitar as tabelas `social_accounts` e `social_snapshots` já criadas: `provider` passa a aceitar `public` (e `youtube_api`), `handle`/`profile_url` viram os campos informados pelo criador. Migração leve para permitir isso e registrar `last_error`.
- Reescrever `src/lib/social.server.ts` como coletor por rede (`fetchYouTubePublic`, `fetchInstagramPublic`, `fetchTikTokPublic`, `fetchFacebookPublic`), cada um retornando `{ followers, likes, posts, raw }` e gravando um snapshot + atualizando `profile_metrics` com `source = 'api'`.
- `src/lib/social.functions.ts`: substituir `initConnect`/`disconnect` por `saveHandles`, `syncNetwork` (manual) e `syncProfile`; manter proteção por `requireSupabaseAuth`.
- `src/components/SocialConnections.tsx` vira formulário de @ por rede com status, número atual, data e botão atualizar.
- `src/routes/api/public/cron/sync-social.tsx` mantém o segredo atual (`SOCIAL_CRON_SECRET`) e passa a percorrer os perfis aprovados; remover a rota de webhook do InsightIQ e as referências às credenciais do provedor.
- Coleta com timeout curto, User-Agent de navegador e tolerância a falha (nunca derruba o salvamento do perfil).
- Precisa de uma chave gratuita da API do YouTube (`YOUTUBE_API_KEY`) — vou pedir no momento da implementação.

## Fora do escopo

Alcance/engajamento real, dados de audiência (idade/gênero/cidade) e Kwai automático.
