## Detalhes técnicos

- `src/routes/auth.tsx`: reescrita do formulário — nome + confirmação de senha no cadastro, erros por campo, estados de carregamento, toasts (`sonner`), link "Esqueci minha senha" abrindo o modo de recuperação, botão Apple via `lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin })`.
- Recuperação: `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/redefinir-senha })`.
- Nova rota pública `src/routes/redefinir-senha.tsx`: detecta o `type=recovery` no retorno, formulário de nova senha + confirmação, `supabase.auth.updateUser({ password })`, e navega para `/dashboard`. `head()` próprio com título/descrição/OG.
- Cadastro: `signUp` com `emailRedirectTo: window.location.origin` e `options.data.full_name`; com confirmação automática ativada a sessão volta na hora, então navegamos direto para `/dashboard`. Guarda de segurança: se por qualquer motivo não vier sessão, mostramos a tela "verifique seu e-mail" em vez de travar.
- Configuração de acesso: ativar confirmação automática (para entrar direto) mantendo o envio do e-mail de verificação; providers Apple + Google habilitados via configuração social gerenciada. Sem cadastro anônimo.
- Faixa de e-mail não confirmado: componente novo lido de `user.email_confirmed_at`, renderizado na área autenticada, com `supabase.auth.resend({ type: "signup" })` no botão reenviar.
- Reaproveita `src/lib/auth-errors.ts` para todas as mensagens; acrescento as regras que faltarem (senha não confere, e-mail obrigatório).
- E-mails saem pelo remetente padrão do Lovable. Depois, se quiser e-mails com a marca saindo de `@sinopinfluencia.com.br`, faço em uma etapa separada.
