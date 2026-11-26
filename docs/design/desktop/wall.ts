/**
 * The agents' desktop wallpaper: xquads' petrol ground (`bg`, DESIGN.md: flat surfaces, no pixel sky, no gradient)
 * with the logo at the bottom left. render.sh bundles this file and screenshots wall.html.
 */
import { AGENTS, NAME, NAME_AT, NAME_BOX, PERSON } from "../../../packages/ui/src/components/Logo";

/**
 * The logo at the bottom left, centered on the dock's line (the dock spans y 844–893): below 840, where a maximized
 * window ends, so it shows whatever is open. The kit's version for petrol: the agents and the name in sand (`ink`),
 * the person in camel (`agent`).
 */
const LOGO = { left: 36, bottom: 15, size: 26, ink: "#ede6e1", person: "#c79d70" };

/** The xquads logo (packages/ui Logo): the symbol and the name as outlines, in the kit's horizontal lockup. */
function logo(): HTMLElement {
  const el = document.createElement("span");
  el.className = "logo";
  el.style.fontSize = `${LOGO.size}px`;
  el.style.left = `${LOGO.left}px`;
  el.style.bottom = `${LOGO.bottom}px`;
  el.style.color = LOGO.ink;
  el.innerHTML =
    `<svg class="mark" viewBox="0 0 256 256" aria-hidden="true"><path fill="${LOGO.person}" d="${PERSON}"/>` +
    `<path d="${AGENTS}"/></svg>` +
    `<svg class="word" viewBox="${NAME_BOX.x} ${NAME_BOX.y} ${NAME_BOX.w} ${NAME_BOX.h}" aria-hidden="true">` +
    `<path transform="${NAME_AT}" d="${NAME}"/></svg>`;
  return el;
}

document.querySelector(".wall")?.append(logo());
