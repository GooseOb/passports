import { div, span } from "./element-creators";
import type { Marriage } from "./types";

export const createMarriageCard = ([date, name, divorceDate = 0]: Marriage) => {
  const card = div("card");
  const dataEl = card.appendChild(div("data"));
  dataEl.appendChild(span(name));
  dataEl.appendChild(span(date)).className = "date";
  const divorceEl = card.appendChild(div("divorce"));
  divorceEl.textContent = "Расторгнут " + divorceDate;
  if (!divorceDate) divorceEl.style.visibility = "hidden";
  return card;
};
