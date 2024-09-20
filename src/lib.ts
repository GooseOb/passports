import { RGB } from "./types";

export const parseRGB = (str: string): RGB =>
  str.match(/\d+/g)!.map(Number) as RGB;
