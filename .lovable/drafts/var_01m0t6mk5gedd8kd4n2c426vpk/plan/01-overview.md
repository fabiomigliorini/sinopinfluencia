# Melhorias no acesso à conta

Quatro coisas: recuperação de senha, cadastro que já entra no perfil, confirmação de e-mail sem travar o uso, e feedback visual claro em cada ação.

## O que muda na prática

**1. Esqueci minha senha**
- Link "Esqueci minha senha" na aba Entrar.
- Tela pede o e-mail e envia o link de redefinição.
- Nova página `/redefinir-senha` onde a pessoa digita a nova senha, com confirmação e força mínima. Depois de salvar, já entra no perfil.

**2. Cadastro entra direto**
- Ao cadastrar, a pessoa é levada imediatamente para a área do perfil — sem trocar de aba nem logar de novo.
- Para isso, a confirmação de e-mail deixa de bloquear a entrada (ativamos a confirmação automática no acesso).
- O e-mail de confirmação continua sendo enviado; enquanto não for confirmado, aparece uma faixa no topo do perfil: "Confirme seu e-mail" + botão "Reenviar e-mail". A faixa desaparece sozinha depois da confirmação.
- Novos campos no cadastro: nome e confirmação de senha (evita erro de digitação).

**3. Feedback em toda ação**
Hoje a tela fica parada. Passa a ter:
- botão com estado "Entrando…" / "Criando conta…" e desabilitado durante o envio;
- toast de sucesso/erro (usa o sistema de avisos já existente no projeto);
- mensagens de erro em português (o tradutor de erros já existe e será reaproveitado);
- validação por campo, exibida abaixo do campo errado.

**4. Login social**
- Apple/iCloud: sim, dá para fazer. Adiciono o botão "Continuar com Apple" ao lado do Google.
- Meta/Facebook: não está disponível no login do Lovable Cloud (só Google, Apple e Microsoft). Para usar Facebook seria preciso migrar a autenticação para uma configuração externa — recomendo não fazer agora. Se quiser um terceiro botão, Microsoft é o que está disponível.
