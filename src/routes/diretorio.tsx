import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/diretorio")({
  component: DirectoryPage,
});

function DirectoryPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Diretório</h1>
    </div>
  );
}
