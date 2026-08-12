import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$slug")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Perfil</h1>
    </div>
  );
}
