import QRCode, { type QRCodeRenderersOptions } from "qrcode";

export class QR {
  constructor(element: HTMLCanvasElement, url: string) {
    this.canvas = element;
    this.url = url;
    this.render();
  }

  public setUrl(url: string) {
    this.url = url;
    return this.render();
  }

  public setColor(color: string) {
    this.options.color.dark = color;
    return this.render();
  }

  private render() {
    return QRCode.toCanvas(this.canvas, this.url, this.options);
  }

  private options = {
    color: {
      dark: "#888",
      light: "#0000",
    },
    width: 256,
    margin: 0,
    errorCorrectionLevel: "L",
  } satisfies QRCodeRenderersOptions;

  private url: string;
  private canvas: HTMLCanvasElement;
}
