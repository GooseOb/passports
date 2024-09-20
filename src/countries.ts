export const countries = (
  [
    ["gsld", [51, 34, 102], "Республика Гусляндия", "goose.svg"],
    ["ngld", [85, 187, 51], "Республика Неогусляндия", "goose.svg"],
    ["duck", [238, 136, 68], "Утиное Государство", "duck.png"],
  ] as const
).map(([code, color, name, stdImg]) => ({
  code,
  name,
  color,
  standardImage: "./standard-image/" + stdImg,
}));
