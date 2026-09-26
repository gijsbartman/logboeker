import { createContext, useContext } from "react";

// Swapping a card between reading and editing makes WebKit scroll the stack
// by itself, so near the bottom the card jumps. Holding keeps the card at the
// same spot on screen: the stack keeps its height until the reader scrolls,
// and any scroll right after the swap is undone.
export const HoldHeightContext = createContext<(from: Element | null) => void>(
  () => {},
);

export const useHoldHeight = () => useContext(HoldHeightContext);
