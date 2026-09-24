import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderApp } from "./render-app";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-24T12:00:00"));
});

afterEach(() => {
  vi.useRealTimers();
});

const stat = (label: string) => screen.getByText(label).parentElement?.textContent;

test("the roadmap shows progress against the semester", async () => {
  renderApp("/kalender");
  expect(await screen.findByRole("heading", { name: "Roadmap" })).toBeInTheDocument();
  expect(stat("Mijlpalen behaald")).toContain("01/4");
  expect(stat("Doelen afgerond")).toContain("00/3");
  expect(stat("Week, sprint 2")).toContain("03/20");

  const week1 = screen.getByRole("group", { name: /^Week 1,/ });
  expect(
    within(week1).getByRole("button", { name: "Mijlpaal ADR tokenlaag vastgelegd, behaald 9 sep" }),
  ).toBeInTheDocument();
  expect(
    within(week1).getByRole("button", { name: "Mijlpaal Sprintreview sprint 1 gegeven, verlopen, bewijs aanwezig" }),
  ).toBeInTheDocument();
  expect(within(week1).getByRole("button", { name: "Bewijsstuk ADR 001 Tokenlaag in app.css" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: /^Week 3,/ })).toHaveAttribute("data-current");
});

test("a milestone opens in the side panel, and its evidence from there", async () => {
  const { user, router } = renderApp("/kalender");
  await user.click(
    await screen.findByRole("button", { name: /^Mijlpaal Sprintreview sprint 1 gegeven/ }),
  );

  expect(await screen.findByText("1 verwijzing")).toBeInTheDocument();
  expect(router.state.location.search).toMatchObject({ open: ["roadmap/mijlpaal/1"] });
  expect(screen.getByText(/Mijlpaal · verlopen, bewijs aanwezig/)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Sprintreview sprint 1" }));
  expect(await screen.findByText("2 verwijzingen")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/kalender");
});

test("a goal opens with the entries that work on it", async () => {
  const { user } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: "Doel Tokenlaag in app.css, bezig" }));

  expect(await screen.findByText("Doel · bezig")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tokenlaag afgestemd met UI/UX" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ADR tokenlaag vastgelegd" })).toBeInTheDocument();
});

test("filters and open references carry over from the list to the calendar", async () => {
  const { user, router } = renderApp('/?vaardigheid=["plannen"]&open=["logboek/daily/2026-09-08"]');
  await user.click(await screen.findByRole("link", { name: "Kalender" }));

  expect(await screen.findByRole("heading", { name: "Roadmap" })).toBeInTheDocument();
  expect(router.state.location.search).toMatchObject({
    vaardigheid: ["plannen"],
    open: ["logboek/daily/2026-09-08"],
  });
  expect(screen.getByText("1 verwijzing")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Mijlpaal ADR tokenlaag/ })).toHaveAttribute("data-dim");
  expect(screen.getByRole("button", { name: /^Mijlpaal Roadmap afgestemd/ })).not.toHaveAttribute("data-dim");
});

test("goals used in entries but missing from the roadmap are listed", async () => {
  renderApp("/kalender");
  const unplanned = await screen.findByRole("region", { name: "Niet ingepland" });
  expect(within(unplanned).getByRole("button", { name: "onboarding inplannen" })).toBeInTheDocument();
});
