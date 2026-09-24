import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { demoFs } from "@/lib/demo-fs";
import { renderApp } from "./render-app";

const PATH = "logboek/roadmap.md";
let original = "";

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-24T12:00:00"));
  original = (await demoFs.readText(PATH))!;
});

afterEach(async () => {
  vi.useRealTimers();
  await demoFs.writeText(PATH, original);
});

const roadmapFile = async () => (await demoFs.readText(PATH))!;

test("an unplanned goal from the entries can be planned in", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "onboarding inplannen" }));

  const dialog = await screen.findByRole("dialog", { name: "Doel inplannen" });
  expect(within(dialog).getByLabelText("Titel")).toHaveValue("Onboarding");
  expect(within(dialog).getByLabelText("Slug")).toHaveAttribute("readonly");
  fireEvent.change(within(dialog).getByLabelText("Tot"), { target: { value: "2026-10-09" } });
  await user.click(within(dialog).getByRole("button", { name: "Opslaan" }));

  expect(await screen.findByRole("button", { name: "Doel Onboarding, bezig" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "onboarding inplannen" })).not.toBeInTheDocument();
  expect(await roadmapFile()).toContain(
    "  - slug: onboarding\n    titel: Onboarding\n    van: 2026-09-24\n    tot: 2026-10-09\n",
  );
});

test("a goal is only completed once its checkbox is ticked", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "Doel Tokenlaag in app.css, bezig" }));
  await user.click(await screen.findByRole("button", { name: "Bewerken" }));
  const dialog = await screen.findByRole("dialog", { name: "Doel bewerken" });

  expect(within(dialog).queryByLabelText("Afgerond op")).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole("checkbox", { name: "Afgerond" }));
  expect(within(dialog).getByLabelText("Afgerond op")).toHaveValue("2026-09-24");
  await user.click(within(dialog).getByRole("button", { name: "Opslaan" }));

  expect(await screen.findByRole("button", { name: "Doel Tokenlaag in app.css, afgerond" })).toBeInTheDocument();
  const file = await roadmapFile();
  expect(file).toContain("    tot: week 4\n    afgerond: 2026-09-24\n");
  expect(file).toContain("  - slug: advies\n    titel: Advies architectuur\n    van: week 8\n    tot: week 12\n    afgerond:\n");
});

test("a new goal needs a period that ends after it starts", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "Doel inplannen" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText("Titel"), "Nieuw advies");
  expect(within(dialog).getByLabelText("Slug")).toHaveValue("nieuw-advies");
  fireEvent.change(within(dialog).getByLabelText("Tot"), { target: { value: "2026-09-01" } });
  await user.click(within(dialog).getByRole("button", { name: "Opslaan" }));

  expect(await within(dialog).findByText("Het einde ligt voor de start")).toBeInTheDocument();
  expect(await roadmapFile()).toBe(original);
});

test("a milestone is added with skills and evidence", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "Mijlpaal toevoegen" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText("Titel"), "Demo gegeven");
  await user.click(within(dialog).getByRole("checkbox", { name: /Boodschap delen/ }));
  await user.type(within(dialog).getByLabelText("Bewijs"), "Sprintreview sprint 1{Enter}");
  await user.click(within(dialog).getByRole("button", { name: "Opslaan" }));

  const week3 = await screen.findByRole("group", { name: /^Week 3,/ });
  expect(
    await within(week3).findByRole("button", { name: "Mijlpaal Demo gegeven, open, bewijs aanwezig" }),
  ).toBeInTheDocument();
  expect(await roadmapFile()).toContain(
    "  - datum: 2026-09-24\n    titel: Demo gegeven\n    bewijs: [Sprintreview sprint 1]\n    vaardigheden: [boodschap-delen]\n",
  );
});

test("a milestone is marked reached from its card", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: /^Mijlpaal Roadmap afgestemd/ }));
  await user.click(await screen.findByRole("button", { name: "Behaald" }));

  expect(
    await screen.findByRole("button", { name: "Mijlpaal Roadmap afgestemd met opdrachtgever, behaald 24 sep" }),
  ).toBeInTheDocument();
  expect(await roadmapFile()).toContain("    vaardigheden: [plannen]\n    behaald: 2026-09-24\n");
});

test("editing a milestone keeps week numbers it did not change", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: /^Mijlpaal Roadmap afgestemd/ }));
  await user.click(await screen.findByRole("button", { name: "Bewerken" }));
  const dialog = await screen.findByRole("dialog", { name: "Mijlpaal bewerken" });
  const titel = within(dialog).getByLabelText("Titel");
  await user.clear(titel);
  await user.type(titel, "Roadmap v1 akkoord");
  await user.click(within(dialog).getByRole("button", { name: "Opslaan" }));

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(await roadmapFile()).toContain("  - datum: week 3\n    titel: Roadmap v1 akkoord\n");
});

test("deleting a goal unlinks its milestones and closes its card", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "Doel Tokenlaag in app.css, bezig" }));
  await user.click(await screen.findByRole("button", { name: "Verwijderen" }));
  await user.click(await screen.findByRole("button", { name: "Definitief verwijderen" }));

  await waitFor(() =>
    expect(screen.queryByRole("button", { name: /^Doel Tokenlaag/ })).not.toBeInTheDocument(),
  );
  expect(screen.queryByText("1 verwijzing")).not.toBeInTheDocument();
  const file = await roadmapFile();
  expect(file).not.toContain("slug: tokens");
  expect(file).not.toContain("doel: tokens");
  expect(screen.getByRole("button", { name: "tokens inplannen" })).toBeInTheDocument();
});

test("problems in the roadmap file are shown above the calendar", async () => {
  await demoFs.writeText(
    PATH,
    [
      "---",
      "mijlpalen:",
      "  - titel: Zonder datum",
      "  - titel: Gepland",
      "    datum: week 5",
      "    bewijs: [Komt nog]",
      "  - titel: Gehaald",
      "    datum: week 2",
      "    bewijs: [Bestaat niet]",
      "    behaald: 2026-09-18",
      "---",
      "",
    ].join("\n"),
  );
  renderApp("/kalender");

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("2 problemen in logboek/roadmap.md");
  expect(alert).toHaveTextContent('Mijlpaal "Gehaald" is behaald, maar bewijs "Bestaat niet" bestaat niet');
  expect(alert).not.toHaveTextContent("Komt nog");
});
