import { expect, test } from "vitest";
import "./daily-schedule-card.js";

test("daily-schedule-card is registered", () => {
  expect(customElements.get("daily-schedule-card")).toBeDefined();
});

test("can create element", () => {
  expect(document.createElement("daily-schedule-card")).toBeInstanceOf(
    HTMLElement,
  );
});
