import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewVaultForm } from "@/features/vaults/new-vault-form";
import { OpenVaultPanel } from "@/features/vaults/open-vault-panel";

export const Route = createFileRoute("/welkom")({
  beforeLoad: ({ context }) => {
    if (context.registry.active) throw redirect({ to: "/" });
  },
  component: Welcome,
});

function Welcome() {
  return (
    <main className="mx-auto grid min-h-svh max-w-4xl content-center gap-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Logboek</h1>
        <p className="text-muted-foreground">Open je logboek, of begin een nieuw logboek voor dit semester.</p>
      </header>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bestaand logboek openen</CardTitle>
            <CardDescription>
              Kies de map waarin <code>data/config.md</code> en <code>logboek/</code> staan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OpenVaultPanel />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nieuw logboek</CardTitle>
            <CardDescription>Maakt de mappen en een config aan in een map naar keuze.</CardDescription>
          </CardHeader>
          <CardContent>
            <NewVaultForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
