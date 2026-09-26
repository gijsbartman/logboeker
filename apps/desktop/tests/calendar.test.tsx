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

const stat = (label: string) => screen.getByText(label, { selector: "dt" }).parentElement?.textContent;
const week = (n: number) => screen.getByRole("group", { name: new RegExp(`^Week ${n},`) });

test("the roadmap shows progress against the semester", async () => {
  renderApp("/kalender");
  expect(await screen.findByRole("heading", { name: "Roadmap" })).toBeInTheDocument();
  expect(stat("Afgerond")).toContain("01/7");
  expect(stat("Verlopen")).toContain("02");
  expect(stat("Week, sprint 2")).toContain("03/20");
  expect(week(3)).toHaveAttribute("data-current");

  expect(
    within(week(1)).getByRole("button", { name: "ADR tokenlaag vastgelegd, afgerond 9 sep" }),
  ).toBeInTheDocument();
  expect(
    within(week(1)).getByRole("button", { name: "Sprintreview sprint 1 gegeven, verlopen, bewijs aanwezig" }),
  ).toBeInTheDocument();
  expect(within(week(1)).getByRole("button", { name: "Bewijsstuk ADR 001 Tokenlaag in app.css" })).toBeInTheDocument();
});

test("a multi-day item is a bar across its days, cut at the week's edges", async () => {
  renderApp("/kalender");
  await screen.findByRole("heading", { name: "Roadmap" });
  const name = "Tokenlaag in app.css, 7 sep tot 2 okt, bezig";

  const first = within(week(1)).getByRole("button", { name });
  expect(first).toHaveStyle({ gridColumn: "1 / 6" });
  expect(first).not.toHaveAttribute("data-before");
  expect(first).toHaveAttribute("data-after");

  const last = within(week(4)).getByRole("button", { name });
  expect(last).toHaveAttribute("data-before");
  expect(last).not.toHaveAttribute("data-after");
  expect(within(week(5)).queryByRole("button", { name })).not.toBeInTheDocument();

  const overlapping = within(week(1)).getByRole("button", { name: /^JS-interop opgeschoond/ });
  expect(overlapping).toHaveStyle({ gridColumn: "2 / 6", gridRow: "2" });
});

test("an item opens in the side panel, and its evidence from there", async () => {
  const { user, router } = renderApp("/kalender");
  await user.click(await screen.findByRole("button", { name: /^Sprintreview sprint 1 gegeven/ }));

  expect(await screen.findByText("1 verwijzing")).toBeInTheDocument();
  expect(router.state.location.search).toMatchObject({ open: ["roadmap/item/4"] });
  expect(screen.getByText("12 sep · verlopen, bewijs aanwezig")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Sprintreview sprint 1" }));
  expect(await screen.findByText("2 verwijzingen")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/kalender");
});

test("an item with a goal lists the entries that work on it", async () => {
  const { user } = renderApp("/kalender");
  await screen.findByRole("heading", { name: "Roadmap" });
  await user.click(within(week(2)).getByRole("button", { name: /^Tokenlaag in app.css/ }));

  expect(await screen.findByText(/Doel: Tokens/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tokenlaag afgestemd met UI/UX" })).toBeInTheDocument();
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
  expect(screen.getByRole("button", { name: /^ADR tokenlaag/ })).toHaveAttribute("data-dim");
  expect(screen.getByRole("button", { name: /^Roadmap afgestemd/ })).not.toHaveAttribute("data-dim");
});

test("goals used in entries but missing from the roadmap are listed", async () => {
  renderApp("/kalender");
  const unplanned = await screen.findByRole("region", { name: "Niet ingepland" });
  expect(within(unplanned).getByRole("button", { name: "onboarding inplannen" })).toBeInTheDocument();
  expect(within(unplanned).queryByRole("button", { name: "tokens inplannen" })).not.toBeInTheDocument();
});
