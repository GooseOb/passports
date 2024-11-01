import { el, children, style } from "./element-creators";
import type { Marriage } from "./types";

export const createMarriageCard = ([date, name, divorceDate = 0]: Marriage) =>
  children(el("div", { className: "card" }), [
    children(el("div", { className: "data" }), [
      el("span", { textContent: name }),
      el("span", { textContent: date, className: "date" }),
    ]),
    style(
      el("div", {
        className: "divorce",
        textContent: "Расторгнут " + divorceDate,
      }),
      { visibility: divorceDate ? "visible" : "hidden" },
    ),
  ]);
