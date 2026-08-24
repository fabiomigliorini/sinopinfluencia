const RULES: Array<[RegExp, string]> = [
  [/password is known to be weak/i, "Essa senha é muito fraca e fácil de adivinhar. Escolha outra senha."],
  [/password should be at least (\d+)/i, "A senha deve ter pelo menos $1 caracteres."],
  [/password should contain/i, "A senha deve conter letras, números e símbolos."],
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar."],
  [/user already registered|already been registered/i, "Este e-mail já está cadastrado. Faça login."],
  [/unable to validate email address|invalid email/i, "Informe um e-mail válido."],
  [/email address .* is invalid/i, "Informe um e-mail válido."],
  [/signups not allowed|signup is disabled/i, "Cadastros estão desativados no momento."],
  [/email rate limit exceeded|over_email_send_rate_limit/i, "Muitos e-mails enviados. Aguarde alguns minutos e tente novamente."],
  [/for security purposes, you can only request this after (\d+) seconds?/i, "Por segurança, tente novamente em $1 segundos."],
  [/too many requests|rate limit/i, "Muitas tentativas. Aguarde um instante e tente novamente."],
  [/new password should be different/i, "A nova senha deve ser diferente da anterior."],
  [/token has expired or is invalid|invalid token/i, "Link expirado ou inválido. Solicite um novo."],
  [/user not found/i, "Usuário não encontrado."],
  [/same password/i, "A nova senha deve ser diferente da atual."],
  [/unsupported provider/i, "Este método de login não está disponível."],
  [/session (not found|missing)|jwt expired/i, "Sua sessão expirou. Entre novamente."],
  [/failed to fetch|network ?error/i, "Falha de conexão. Verifique sua internet e tente novamente."],
  [/weak password/i, "Senha muito fraca. Use uma senha mais forte."],
  [/passwords? do not match|do not match/i, "As senhas não conferem."],
  [/email.*required|missing email/i, "Informe seu e-mail."],
  [/password.*required|missing password/i, "Informe sua senha."],
  [/auth session missing/i, "Link expirado ou inválido. Solicite um novo."],
  [/provider is not enabled|unsupported provider/i, "Este método de login não está disponível."],
];

/** Traduz mensagens de erro de autenticação para português. */
export function translateAuthError(input: unknown): string {
  const message =
    input instanceof Error
      ? input.message
      : typeof input === "string"
        ? input
        : typeof input === "object" && input !== null && "message" in input
          ? String((input as { message: unknown }).message)
          : "";

  if (!message) return "Ocorreu um erro inesperado. Tente novamente.";

  for (const [pattern, translation] of RULES) {
    const match = message.match(pattern);
    if (match) return translation.replace(/\$(\d)/g, (_, i) => match[Number(i)] ?? "");
  }

  return message;
}
