import type { RGB, ReadonlyRGB } from "./types";

const rgbToHex = (rgb: ReadonlyRGB): string =>
  rgb.reduce((acc, c) => acc + (c > 15 ? "" : "0") + c.toString(16), "#");

export class SmoothColorUpdater {
  constructor(
    color: SmoothColorUpdater["color"],
    onColorChange: SmoothColorUpdater["onColorChange"],
  ) {
    this.color = color;
    this.onColorChange = onColorChange;
  }

  public set(color: ReadonlyRGB, frames = 60) {
    if (this.colorChanging) {
      cancelAnimationFrame(this.colorChanging);
    }

    const delta: RGB = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      delta[i] = (this.color[i] - color[i]) / frames;
    }

    const targetHEX = rgbToHex(color);

    const changeColor = () => {
      for (let i = 0; i < 3; i++) this.color[i] -= delta[i];
      const currHEX = rgbToHex(this.color.map(Math.round) as RGB);
      if (currHEX !== targetHEX) {
        this.colorChanging = requestAnimationFrame(changeColor);
      }
      this.onColorChange(currHEX);
    };
    this.colorChanging = requestAnimationFrame(changeColor);
  }

  private onColorChange: (colorHEX: string) => void;
  private color: RGB;
  private colorChanging?: number;
}
