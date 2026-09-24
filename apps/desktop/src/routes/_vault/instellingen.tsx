import { PATHS } from "@logboeker/vault";
import { createFileRoute, Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVault, useVaultSource } from "@/lib/vault";

export const Route = createFileRoute("/_vault/instellingen")({
  component: Settings,
});

const LABELS: Record<string, string> = {
  student_naam: "Naam",
  projectnaam: "Project",
  rol: "Rol",
  semesterstart: "Semesterstart",
  sprintlengte_weken: "Sprintlengte in weken",
  code_repo: "Code-repository",
  tracker: "Tracker",
};

function BackButton() {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  if (canGoBack) {
    return (
      <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
        <ArrowLeft />
        Terug
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link to="/">
        <ArrowLeft />
        Naar overzicht
      </Link>
    </Button>
  );
}

function Settings() {
  const { config } = useVault();
  const source = useVaultSource();
  const known = Object.keys(LABELS).filter((key) => config[key] !== undefined);
  const other = Object.keys(config).filter((key) => !(key in LABELS));

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <BackButton />
      <Card>
        <CardHeader>
          <CardTitle>Instellingen</CardTitle>
          <CardDescription>
            Uit <code>{PATHS.config}</code> in <code>{source.root}</code>. Bewerken kan hier nog niet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {[...known, ...other].map((key) => (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">{LABELS[key] ?? key}</dt>
                <dd className="break-all">{String(config[key])}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}
