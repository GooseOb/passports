import type { RGB } from "./types";

export const parseRGB = (str: string): RGB =>
  str.match(/\d+/g)!.map(Number) as RGB;

export const setNodesContent = <
  TNodes extends Record<string, { textContent: any }>,
  TKey extends keyof TNodes,
>(
  nodes: TNodes,
  obj: { [Key in TKey]: TNodes[Key]["textContent"] },
) => {
  for (const key in obj) nodes[key].textContent = obj[key];
};
