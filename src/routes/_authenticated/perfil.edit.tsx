import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/perfil/edit")({
  component: EditProfilePage,
});

function EditProfilePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Editar Perfil</h1>
    </div>
  );
}
