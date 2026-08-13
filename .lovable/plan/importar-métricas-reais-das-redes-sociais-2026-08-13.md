# Importar métricas reais das redes sociais

O criador conecta as próprias contas (Instagram, TikTok, YouTube, Facebook, LinkedIn) dentro do painel dele, e as métricas passam a ser preenchidas automaticamente — sem digitar números à mão.

## Como vai funcionar

1. Em **Editar meu perfil** aparece um bloco "Conectar redes sociais" com um botão por rede.
2. Ao clicar, abre a tela de autorização da própria rede (login do criador). Ele aceita e volta para o painel.
3. O app busca os números na hora e mostra: seguidores, engajamento, curtidas/comentários médios, número de posts e (quando a rede libera) alcance e dados de audiência.
4. Métricas vindas da API ganham o selo **"Verificado via API"** no perfil público; métricas digitadas à mão continuam existindo, mas ficam marcadas como declaradas.
5. Atualização **diária automática** (madrugada) para todos os perfis conectados, mais um botão **"Atualizar agora"** no painel do criador e no painel da ACES.
6. Histórico: cada coleta é guardada, permitindo mostrar evolução (ex.: "+8% em 30 dias") depois.

## Fornecedor (decisão necessária antes de construir)

Vamos usar uma API agregadora, que cobre todas as redes com uma integração só. Recomendo a **InsightIQ (antiga Phyllo)**: tem SDK de conexão do criador (o próprio criador autoriza), cobre Instagram, TikTok, YouTube, Facebook, LinkedIn e Twitch, e devolve métricas de perfil e de conteúdo. A Modash é a alternativa (não exige login do criador, mas é baseada em dados públicos e não traz alcance/stories).

O que preciso de você:
- Criar a conta na InsightIQ (ou Modash) e escolher o plano.
- Me passar as credenciais (client ID / secret ou API key) — eu peço pelo formulário seguro de segredos, nunca ficam no código.

Enquanto as credenciais não existirem, o bloco de conexão fica visível mas desabilitado com o aviso "integração em configuração", e o cadastro manual continua funcionando normalmente.

## Limitações honestas

- **Instagram/Facebook**: só contas Business/Criador conseguem liberar métricas. Conta pessoal não retorna dados.
- **Kwai**: não tem API — segue manual.
- **X (Twitter)**: dados limitados e caros; deixo manual por enquanto.
- Cada rede tem seu próprio conjunto de campos; o app mostra o que a rede entrega, sem inventar número.

## Detalhes técnicos

**Banco (migração)**
- `social_accounts`: `profile_id`, `network`, `provider_account_id`, `handle`, `provider` (insightiq), `provider_user_id`, `connected_at`, `last_synced_at`, `sync_status`, `sync_error`. RLS: dono lê/gerencia o próprio, admin gerencia tudo, público lê apenas de perfis aprovados (só `network` + `handle`).
- `social_snapshots`: `social_account_id`, `captured_at`, `followers`, `following`, `posts_count`, `engagement_rate`, `avg_likes`, `avg_comments`, `avg_views`, `reach`, `raw jsonb`. Guarda histórico; público lê o mais recente de perfis aprovados.
- `profile_metrics` ganha `source` (`manual` | `api`) e `verified_at`, para o selo de verificado.
- Tokens/segredos do provedor nunca ficam em tabela pública — só o `account_id` do provedor; a troca de token acontece no servidor.

**Servidor (TanStack)**
- `src/lib/social.functions.ts` (autenticado): `createConnectSession` (gera o token do SDK do provedor), `listMyConnections`, `disconnectAccount`, `syncMyAccount`.
- `src/lib/social.server.ts`: cliente do provedor (auth básica com as credenciais em `process.env`), normalização das métricas por rede e gravação de snapshot + `profile_metrics`.
- `src/routes/api/public/webhooks/insightiq.ts`: recebe `ACCOUNT_CONNECTED` / `PROFILE_UPDATED`, valida assinatura HMAC com segredo próprio, e dispara sync.
- `src/routes/api/public/cron/sync-social.ts`: sincroniza contas com `last_synced_at` antiga; protegido por header com segredo (`CRON_SECRET`); agendado por `pg_cron` diariamente às 05:00 UTC apontando para a URL estável do projeto.
- Segredos: `INSIGHTIQ_CLIENT_ID`, `INSIGHTIQ_SECRET`, `INSIGHTIQ_WEBHOOK_SECRET`, `CRON_SECRET`.

**Front**
- `src/components/SocialConnections.tsx` usado em `/perfil/edit`: lista redes, estado (conectada/desconectada/erro), botão conectar via SDK do provedor, desconectar e "Atualizar agora".
- `/perfil/edit`: métricas de rede conectada ficam somente leitura, com origem "API".
- `/$slug` e `ProfileCard`: selo "Verificado via API" e data da última atualização.
- `/admin/perfis`: coluna de contas conectadas e botão de re-sincronizar por perfil.

## Ordem de execução

1. Migração das tabelas + campos de origem.
2. Camada de servidor + segredos (com fallback desabilitado se não houver credenciais).
3. UI de conexão no painel do criador.
4. Selo de verificado no perfil público e diretório.
5. Cron diário + botão manual + visão no painel da ACES.
