import { useEffect, useRef, type RefObject } from "react";

// Popovers, menus and dialogs render in a portal, but still belong to
// whatever opened them, and resizing the panels is not leaving the editor.
const IGNORED =
  "[data-radix-popper-content-wrapper], [role=dialog], [role=listbox], [role=menu], [data-slot=resizable-handle]";

// Calls onDismiss once a click or focus lands outside the card the element
// sits in, so an editor closes when it is simply no longer being used.
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  const latest = useRef(onDismiss);
  latest.current = onDismiss;

  useEffect(() => {
    const handle = (event: Event) => {
      const element = ref.current;
      const root = element?.closest('[data-slot="entry"]') ?? element;
      const target = event.target;
      if (!root || !(target instanceof Element) || root.contains(target))
        return;
      if (target.closest(IGNORED)) return;
      latest.current();
    };
    document.addEventListener("pointerdown", handle);
    document.addEventListener("focusin", handle);
    return () => {
      document.removeEventListener("pointerdown", handle);
      document.removeEventListener("focusin", handle);
    };
  }, [ref]);
}
