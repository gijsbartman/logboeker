import { expect, test } from "vitest";
import { VAARDIGHEDEN, isVaardigheid } from "../src/vaardigheden";

test("er zijn tien unieke vaardigheidsslugs", () => {
  expect(new Set(VAARDIGHEDEN).size).toBe(10);
});

test("isVaardigheid herkent vaste slugs en weigert beroepstaken", () => {
  expect(isVaardigheid("samenwerken")).toBe(true);
  expect(isVaardigheid("bt-analyseren")).toBe(false);
});
