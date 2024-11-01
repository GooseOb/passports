export const el = <TTag extends keyof HTMLElementTagNameMap>(
  tag: TTag,
  props: Partial<HTMLElementTagNameMap[TTag]>,
) => Object.assign(document.createElement(tag), props);

export const children = <T extends HTMLElement>(
  el: T,
  children: HTMLElement[],
) => {
  el.append(...children);
  return el;
};

export const style = <T extends HTMLElement>(
  el: T,
  style: Partial<CSSStyleDeclaration>,
) => {
  Object.assign(el.style, style);
  return el;
};
