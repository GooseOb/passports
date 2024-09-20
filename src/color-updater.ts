import { RGB, ReadonlyRGB } from "./types";

const rgbToHex = (rgb: ReadonlyRGB): string =>
  rgb.reduce((acc, c) => acc + (c > 15 ? "" : "0") + c.toString(16), "#");

type ColorSetter = (colorHEX: string) => void;

export class SmoothColorUpdater {
  constructor(color: RGB, setColor: ColorSetter) {
    this.color = color;
    this.setColor = setColor;
  }

  public set(color: ReadonlyRGB, frames = 60) {
    if (this.colorChanging) cancelAnimationFrame(this.colorChanging);

    const delta: RGB = [0, 0, 0];
    for (let i = 0; i < 3; i++) delta[i] = (this.color[i] - color[i]) / frames;

    const targetHEX = rgbToHex(color);

    const changeColor = () => {
      for (let i = 0; i < 3; i++) this.color[i] -= delta[i];
      const currHEX = rgbToHex(this.color.map((num) => Math.round(num)) as RGB);
      if (currHEX !== targetHEX)
        this.colorChanging = requestAnimationFrame(changeColor);
      this.setColor(currHEX);
    };
    this.colorChanging = requestAnimationFrame(changeColor);
  }

  private setColor: ColorSetter;
  private color: RGB;
  private colorChanging?: number;
}
