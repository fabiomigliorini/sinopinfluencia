import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Entrar / Cadastrar</h1>
    </div>
  );
}
