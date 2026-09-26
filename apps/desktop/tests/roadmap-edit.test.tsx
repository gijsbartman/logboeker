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
const week = (n: number) => screen.getByRole("group", { name: new RegExp(`^Week ${n},`) });
const setDate = (field: HTMLElement, value: string) => fireEvent.change(field, { target: { value } });

// Opens the item's card and edits it; the newest card is the last one open.
async function editItem(user: ReturnType<typeof renderApp>["user"], name: RegExp, scope = screen) {
  await user.click(await scope.findByRole("button", { name }));
  const edit = await screen.findAllByRole("button", { name: "Bewerken" });
  await user.click(edit[edit.length - 1]!);
  return screen.findByRole("dialog", { name: "Item bewerken" });
}

test("an unplanned goal from the entries is planned in as a multi-day item", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "onboarding inplannen" }));

  const dialog = await screen.findByRole("dialog", { name: "Nieuw item" });
  expect(within(dialog).getByLabelText("Titel")).toHaveValue("Onboarding");
  expect(within(dialog).getByRole("switch", { name: "Meerdaags" })).toBeChecked();
  expect(within(dialog).getByLabelText("Doel")).toHaveValue("onboarding");
  setDate(within(dialog).getByLabelText("Tot"), "2026-10-09");
  await user.click(within(dialog).getByRole("button", { name: "Toevoegen" }));

  expect(
    await within(week(3)).findByRole("button", { name: "Onboarding, 24 sep tot 9 okt, bezig" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "onboarding inplannen" })).not.toBeInTheDocument();
  expect(await roadmapFile()).toContain(
    "  - titel: Onboarding\n    datum: 2026-09-24\n    tot: 2026-10-09\n    doel: onboarding\n---",
  );
});

test("double-clicking a day adds an item on that date, with a goal picked from the list", async () => {
  const { user } = renderApp("/kalender");
  await screen.findByRole("heading", { name: "Roadmap" });
  await user.dblClick(screen.getByText(/14 okt$/).closest(".calendar-day")!);

  const dialog = await screen.findByRole("dialog", { name: "Nieuw item" });
  expect(within(dialog).getByLabelText("Datum")).toHaveValue("2026-10-14");
  await user.type(within(dialog).getByLabelText("Titel"), "Demo gegeven");
  await user.selectOptions(within(dialog).getByLabelText("Doel"), "tokens");
  await user.click(within(dialog).getByRole("checkbox", { name: /Boodschap delen/ }));
  await user.type(within(dialog).getByLabelText("Bewijs"), "Demo-opname{Enter}");
  expect(within(dialog).getByText(/nog niet gevonden/)).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Toevoegen" }));

  expect(await within(week(6)).findByRole("button", { name: "Demo gegeven, gepland" })).toBeInTheDocument();
  expect(await roadmapFile()).toContain(
    "  - titel: Demo gegeven\n    datum: 2026-10-14\n    doel: tokens\n    vaardigheden: [boodschap-delen]\n    bewijs: [Demo-opname]\n---",
  );
});

test("a new goal gets its slug from its name", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "Nieuw item" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText("Titel"), "Advies");
  await user.selectOptions(within(dialog).getByLabelText("Doel"), "Nieuw doel…");
  await user.type(within(dialog).getByLabelText("Naam van het doel"), "Advies rapport");
  expect(within(dialog).getByText("advies-rapport")).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Toevoegen" }));

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(await roadmapFile()).toContain("    doel: advies-rapport\n");
});

test("a range must end after it starts", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "Nieuw item" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText("Titel"), "Sprint");
  await user.click(within(dialog).getByRole("switch", { name: "Meerdaags" }));
  setDate(within(dialog).getByLabelText("Tot"), "2026-09-01");
  await user.click(within(dialog).getByRole("button", { name: "Toevoegen" }));

  expect(await within(dialog).findByText("Het einde ligt voor de start")).toBeInTheDocument();
  expect(await roadmapFile()).toBe(original);
});

test("finishing an item in the editor keeps the week numbers it did not change", async () => {
  const { user } = renderApp("/kalender");
  await screen.findByRole("heading", { name: "Roadmap" });
  const dialog = await editItem(user, /^JS-interop opgeschoond/, within(week(1)));

  expect(within(dialog).queryByLabelText("Afgerond op")).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole("switch", { name: "Afgerond" }));
  expect(within(dialog).getByLabelText("Afgerond op")).toHaveValue("2026-09-24");
  await user.click(within(dialog).getByRole("button", { name: "Opslaan" }));

  expect(
    await within(week(1)).findByRole("button", { name: "JS-interop opgeschoond, 8 sep tot 18 sep, afgerond 24 sep" }),
  ).toBeInTheDocument();
  expect(await roadmapFile()).toContain("    datum: 2026-09-08\n    tot: week 2\n    doel: js-interop\n    afgerond: 2026-09-24\n");
});

test("an item is finished from its card", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: /^Roadmap afgestemd/ }));
  await user.click(await screen.findByRole("button", { name: "Afgerond" }));

  expect(
    await screen.findByRole("button", { name: "Roadmap afgestemd met opdrachtgever, afgerond 24 sep" }),
  ).toBeInTheDocument();
  expect(await roadmapFile()).toContain("    vaardigheden: [plannen]\n    afgerond: 2026-09-24\n");
});

test("turning a day into a range writes the start date in full", async () => {
  const { user } = renderApp("/kalender");
  const dialog = await editItem(user, /^Roadmap afgestemd/);
  await user.click(within(dialog).getByRole("switch", { name: "Meerdaags" }));
  setDate(within(dialog).getByLabelText("Tot"), "2026-10-02");
  await user.click(within(dialog).getByRole("button", { name: "Opslaan" }));

  expect(
    await within(week(4)).findByRole("button", { name: /^Roadmap afgestemd met opdrachtgever, 25 sep tot 2 okt/ }),
  ).toBeInTheDocument();
  expect(await roadmapFile()).toContain(
    "  - titel: Roadmap afgestemd met opdrachtgever\n    datum: 2026-09-25\n    vaardigheden: [plannen]\n    tot: 2026-10-02\n",
  );
});

test("deleting an item from the editor keeps other open cards pointing at the right item", async () => {
  const { user, router } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: /^Evaluatie Plannen N2/ }));
  const dialog = await editItem(user, /^Sprintreview sprint 1 gegeven/);
  await user.click(within(dialog).getByRole("button", { name: "Verwijderen" }));
  await user.click(within(dialog).getByRole("button", { name: "Definitief verwijderen" }));

  await waitFor(() => expect(router.state.location.search).toMatchObject({ open: ["roadmap/item/5"] }));
  expect(screen.queryByRole("button", { name: /^Sprintreview sprint 1 gegeven/ })).not.toBeInTheDocument();
  expect(screen.getByText("16 okt · gepland")).toBeInTheDocument();
  expect(await roadmapFile()).not.toContain("Sprintreview sprint 1 gegeven");
});

test("problems in the roadmap file are shown above the calendar", async () => {
  await demoFs.writeText(
    PATH,
    [
      "---",
      "planning:",
      "  - titel: Zonder datum",
      "  - titel: Gepland",
      "    datum: week 5",
      "    bewijs: [Komt nog]",
      "  - titel: Klaar",
      "    datum: week 2",
      "    bewijs: [Bestaat niet]",
      "    afgerond: 2026-09-18",
      "---",
      "",
    ].join("\n"),
  );
  renderApp("/kalender");

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("2 problemen in logboek/roadmap.md");
  expect(alert).toHaveTextContent('"Klaar" is afgerond, maar bewijs "Bestaat niet" bestaat niet');
  expect(alert).not.toHaveTextContent("Komt nog");
});
