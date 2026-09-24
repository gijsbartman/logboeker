import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderApp } from "./render-app";

async function hoverSpan(text: RegExp) {
  const { user } = renderApp();
  await user.hover(await screen.findByText(text));
  const content = await waitFor(() => {
    const element = document.querySelector<HTMLElement>('[data-slot="hover-card-content"]');
    if (!element) throw new Error("Hover card did not open");
    return element;
  });
  return within(content);
}

test("a span with one skill shows its criteria open", async () => {
  const card = await hoverSpan(/Ik heb de zes JS-bestanden/);
  expect(card.getByRole("button", { name: /Overzicht creëren/ })).toHaveAttribute("aria-expanded", "true");
});

test("a span with several skills starts with every skill collapsed", async () => {
  const card = await hoverSpan(/Voor de typed interop wrapper/);
  for (const name of [/Plannen/, /Kwalitatief product maken/]) {
    expect(card.getByRole("button", { name })).toHaveAttribute("aria-expanded", "false");
  }
});
