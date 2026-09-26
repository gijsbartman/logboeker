import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { demoFs } from "@/lib/demo-fs";
import { useUiStore } from "@/lib/ui-store";
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
  useUiStore.setState({ editing: null, revealed: null });
  await demoFs.writeText(PATH, original);
});

type User = ReturnType<typeof renderApp>["user"];

const roadmapFile = async () => (await demoFs.readText(PATH))!;
const week = (n: number) => screen.getByRole("group", { name: new RegExp(`^Week ${n},`) });
const setDate = (field: HTMLElement, value: string) => fireEvent.change(field, { target: { value } });

// jsdom gives every element a zero-size box, so the resize handle between the
// panels claims each click; focus the field directly before typing.
async function typeInto(user: User, field: HTMLElement, text: string) {
  field.focus();
  await user.keyboard(text);
}

async function openEditor() {
  const title = await screen.findByRole("textbox", { name: "Titel" });
  return within(title.closest("article")!);
}

async function editItem(user: User, name: RegExp, titel: string, scope = screen) {
  await user.click(await scope.findByRole("button", { name }));
  await user.click(await screen.findByRole("button", { name: `${titel} bewerken` }));
  return openEditor();
}

test("an unplanned goal is planned in as a multi-day item and opens for editing", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "onboarding inplannen" }));

  const card = await openEditor();
  expect(card.getByRole("textbox", { name: "Titel" })).toHaveValue("Onboarding");
  expect(card.getByRole("switch", { name: "Meerdaags" })).toBeChecked();
  expect(card.getByLabelText("Doel")).toHaveValue("onboarding");
  expect(
    within(week(3)).getByRole("button", { name: "Onboarding, 24 sep tot 1 okt, bezig" }),
  ).toBeInTheDocument();
  expect(await roadmapFile()).toContain(
    "  - titel: Onboarding\n    datum: 2026-09-24\n    tot: 2026-10-01\n    doel: onboarding\n---",
  );
});

test("double-clicking a day adds an item there, edited field by field", async () => {
  const { user } = renderApp("/kalender");
  await screen.findByRole("heading", { name: "Roadmap" });
  await user.dblClick(screen.getByText(/14 okt$/).closest(".calendar-day")!);

  const card = await openEditor();
  const title = card.getByRole("textbox", { name: "Titel" });
  expect(title).toHaveValue("Nieuw item");
  expect(title).toHaveFocus();
  await user.clear(title);
  await typeInto(user, title, "Demo gegeven{Enter}");
  await user.selectOptions(card.getByLabelText("Doel"), "tokens");
  await user.click(card.getByRole("checkbox", { name: /Boodschap delen/ }));
  await typeInto(user, card.getByLabelText("Bewijs"), "Demo-opname{Enter}");

  expect(await within(week(6)).findByRole("button", { name: "Demo gegeven, gepland" })).toBeInTheDocument();
  await waitFor(async () =>
    expect(await roadmapFile()).toContain(
      "  - titel: Demo gegeven\n    datum: 2026-10-14\n    doel: tokens\n    vaardigheden: [boodschap-delen]\n    bewijs: [Demo-opname]\n---",
    ),
  );
});

test("a new goal gets its slug from its name", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "Nieuw item" }));
  const card = await openEditor();
  await user.selectOptions(card.getByLabelText("Doel"), "Nieuw doel…");
  await typeInto(user, await card.findByLabelText("Naam van het doel"), "Advies rapport");
  expect(card.getByText("advies-rapport")).toBeInTheDocument();
  await user.keyboard("{Enter}");

  await waitFor(async () => expect(await roadmapFile()).toContain("    doel: advies-rapport\n"));
});

test("a range that ends before it starts is not saved", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "Nieuw item" }));
  const card = await openEditor();
  await user.click(card.getByRole("switch", { name: "Meerdaags" }));
  setDate(await card.findByLabelText("Tot"), "2026-09-01");

  expect(await card.findByText("Het einde ligt voor de start")).toBeInTheDocument();
  expect(await roadmapFile()).toContain("  - titel: Nieuw item\n    datum: 2026-09-24\n    tot: 2026-09-24\n---");
});

test("finishing an item keeps the week numbers it did not change", async () => {
  const { user } = renderApp("/kalender");
  await screen.findByRole("heading", { name: "Roadmap" });
  const card = await editItem(user, /^JS-interop opgeschoond/, "JS-interop opgeschoond", within(week(1)));
  await user.click(card.getByRole("switch", { name: "Afgerond" }));

  expect(await card.findByLabelText("Afgerond op")).toHaveValue("2026-09-24");
  expect(await roadmapFile()).toContain("    datum: 2026-09-08\n    tot: week 2\n    doel: js-interop\n    afgerond: 2026-09-24\n");
});

test("an item is finished from its card", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: /^Roadmap afgestemd/ }));
  await user.click(await screen.findByRole("button", { name: "Roadmap afgestemd met opdrachtgever afronden" }));

  expect(
    await screen.findByRole("button", { name: "Roadmap afgestemd met opdrachtgever, afgerond 24 sep" }),
  ).toBeInTheDocument();
  expect(await roadmapFile()).toContain("    vaardigheden: [plannen]\n    afgerond: 2026-09-24\n");
});

test("turning a day into a range writes the start date in full", async () => {
  const { user } = renderApp("/kalender");
  const card = await editItem(user, /^Roadmap afgestemd/, "Roadmap afgestemd met opdrachtgever");
  await user.click(card.getByRole("switch", { name: "Meerdaags" }));
  setDate(await card.findByLabelText("Tot"), "2026-10-02");

  expect(
    await within(week(4)).findByRole("button", { name: /^Roadmap afgestemd met opdrachtgever, 25 sep tot 2 okt/ }),
  ).toBeInTheDocument();
  expect(await roadmapFile()).toContain(
    "  - titel: Roadmap afgestemd met opdrachtgever\n    datum: 2026-09-25\n    vaardigheden: [plannen]\n    tot: 2026-10-02\n",
  );
});

test("the editor closes and saves once you click outside it", async () => {
  const { user } = renderApp("/kalender");
  const card = await editItem(user, /^Roadmap afgestemd/, "Roadmap afgestemd met opdrachtgever");
  const title = card.getByRole("textbox", { name: "Titel" });
  await user.clear(title);
  await typeInto(user, title, "Roadmap v1 akkoord");
  await user.click(screen.getByRole("heading", { name: "Roadmap" }));

  await waitFor(() => expect(screen.queryByRole("textbox", { name: "Titel" })).not.toBeInTheDocument());
  await waitFor(async () =>
    expect(await roadmapFile()).toContain("  - titel: Roadmap v1 akkoord\n    datum: week 3\n"),
  );
});

test("deleting an item keeps other open cards pointing at the right item", async () => {
  const { user, router } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: /^Evaluatie Plannen N2/ }));
  const card = await editItem(user, /^Sprintreview sprint 1 gegeven/, "Sprintreview sprint 1 gegeven", within(week(1)));
  await user.click(card.getByRole("button", { name: "Verwijderen" }));
  await user.click(card.getByRole("button", { name: "Definitief verwijderen" }));

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
