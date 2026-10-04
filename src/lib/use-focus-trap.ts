"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Moves focus into a modal container on open, traps Tab navigation inside it,
 * and restores focus to the previously focused element on close. Used by the
 * dialogs and the topbar dropdown menus.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const root = container;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    root.setAttribute("tabindex", "-1");
    root.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (event.shiftKey) {
        if (current === first || current === root) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.removeAttribute("tabindex");
      previouslyFocused?.focus();
    };
  }, [active, ref]);
}
