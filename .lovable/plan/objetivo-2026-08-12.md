Plataforma Sinop Influencia — Vitrine de criadores com cadastro, curadoria e perfis públicos

## Objetivo
Transformar o modelo HTML estático em uma plataforma web real (TanStack Start + React) onde empresas possam encontrar influenciadores certificados e os próprios criadores possam cadastrar e gerenciar seus perfis. O visual será revisado para uma direção mais refinada e profissional, mantendo a leitura do conteúdo e a estrutura narrativa do modelo original.

## Escopo do MVP

### Funcionalidades públicas
1. **Home** com hero de busca, seção "Como funciona" e destaques de criadores.
2. **Diretório** (`/diretorio`) com filtros por nicho, categoria, rede e busca por nome.
3. **Página de perfil** (`/perfil/$slug`) para cada criador aprovado, com métricas, formatos, portfólio e contato.
4. **SEO por rota**: títulos, descrições e metadados sociais individuais.

### Funcionalidades para influenciadores
1. **Cadastro** (`/cadastro`) com email/senha via Lovable Cloud Auth.
2. **Login** (`/login`) e logout.
3. **Área logada** (`/minha-conta`) para editar o próprio perfil: bio, nicho, redes sociais, métricas, formatos de trabalho, portfólio e marcas já trabalhadas.
4. **Status do perfil**: o criador pode salvar rascunho, mas o perfil só fica público após aprovação da curadoria.

### Funcionalidades para admin/ACES
1. **Painel admin** (`/admin/perfis`) para listar perfis pendentes, aprovados e rejeitados.
2. **Ação de aprovar/rejeitar** com mensagem opcional.
3. Papel `admin` atribuído manualmente no banco de dados (não via auto-cadastro).

## Tecnologia e backend
- **Lovable Cloud** (Supabase) habilitado para autenticação, banco PostgreSQL e storage de imagens.
- **Auth**: email/senha com confirmação de email.
- **Storage**: avatares e imagens de portfólio dos perfis.
- **RLS**: políticas para garantir que criadores editem apenas seus perfis e que admins acessem o painel.

## Banco de dados (resumo)

### Tabelas principais
- `public.profiles` (estendendo `auth.users`): nome, slug, nicho, categoria/tier, bio, cidade, status (`draft`, `pending`, `approved`, `rejected`), contato, links de redes sociais.
- `public.profile_metrics`: seguidores por rede (Instagram, TikTok, YouTube, etc.) e percentual de audiência local.
- `public.profile_formats`: formatos de trabalho (Reels, Stories, UGC, etc.).
- `public.profile_works`: portfólio (título, imagem, descrição).
- `public.profile_brands`: marcas com as quais trabalhou.
- `public.user_roles`: papel `admin` separado da tabela de usuários (regra de segurança).

### Segurança
- Tabela `user_roles` seguindo o padrão de roles separado.
- Função `public.has_role()` para verificar admin em RLS.
- Políticas que permitem:
  - leitura pública de perfis `approved`;
  - leitura/escrita do próprio perfil pelo criador autenticado;
  - leitura de todos os perfis por admins.

## Design e UX
- Revisar identidade visual para uma direção mais limpa e profissional, mantendo o verde como cor principal (mas ajustado em oklch) e o amarelo como destaque.
- Tipografia: manter Poppins como escolha de marca, carregada via `<link>` no `__root.tsx`.
- Componentes reutilizáveis: Header, Footer, HeroSearch, Card de criador, filtros, formulário de perfil, painel admin.
- Responsivo e acessível (foco, contraste, texto alternativo).

## Estrutura de rotas
```text
/                       → Home
/diretorio              → Diretório de criadores
/perfil/$slug           → Página pública de perfil
/cadastro               → Cadastro de novo influenciador
/login                  → Login
/minha-conta            → Área logada do criador (editar perfil)
/admin/perfis           → Painel admin de curadoria
```

## Entregáveis por fase

### Fase 1 — Fundação
- Habilitar Lovable Cloud.
- Criar design system e tokens de cor no `src/styles.css`.
- Criar layout base (Header, Footer) e rotas estáticas principais.

### Fase 2 — Autenticação e perfil
- Tabelas de autenticação e perfis com RLS.
- Telas de cadastro/login.
- Área `/minha-conta` com formulário de edição do perfil.
- Upload de avatar e imagens de portfólio.

### Fase 3 — Diretório e curadoria
- Diretório com filtros e busca.
- Página pública de perfil (`/perfil/$slug`).
- Painel admin para aprovar/rejeitar perfis.

### Fase 4 — Polimento
- SEO, metadados sociais por rota.
- Testes de responsivo e acessibilidade.
- Ajustes de texto e revisão final.

## Decisões pendentes para próximo alinhamento
1. **Nome de domínio/marca**: manter "Sinop Influencia" ou alterar?
2. **Categorias/tiers**: manter Criador / Destaque / Referência / Ícone? Quem define os critérios?
3. **Redes sociais**: além de Instagram, TikTok e YouTube, incluir outras?
4. **Portfólio**: o criador faz upload de imagens, links de posts ou ambos?
5. **Contato**: botão de WhatsApp/e-mail deve abrir link direto ou apenas mostrar?

## Critérios de sucesso
- Um visitante não logado pode navegar no diretório e ver perfis públicos.
- Um criador pode se cadastrar, preencher o perfil e enviar para aprovação.
- Um admin pode aprovar/rejeitar perfis e o perfil aprovado aparece publicamente.
- O site é responsivo, rápido e com SEO básico configurado.
