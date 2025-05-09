import labels from "./labels.json";

/**
 * Render prediction boxes
 * @param canvasRef HTMLCanvasElement - canvas tag reference
 * @param boxes_data Float32Array | number[] - flattened box coordinates
 * @param scores_data Float32Array | number[] - confidence scores
 * @param classes_data Uint8Array | number[] - predicted class indices
 * @param ratios number[] - [xRatio, yRatio] scaling factors
 */
export const renderBoxes = (
  canvasRef: HTMLCanvasElement,
  boxes_data: Float32Array | number[],
  scores_data: Float32Array | number[],
  classes_data: Uint8Array | number[],
  ratios: [number, number]
): void => {
  const ctx = canvasRef.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const colors = new Colors();


  const fontSize = Math.max(Math.round(Math.max(ctx.canvas.width, ctx.canvas.height) / 40), 14);
  const font = `${fontSize}px Arial`;
  ctx.font = font;
  ctx.textBaseline = "top";

  // for (let i = 0; i < scores_data.length; ++i) {
  //   const classId = classes_data[i];
  //   const klass = labels[classId];
  //   const color = colors.get(classId);
  //   const score = (scores_data[i] * 100).toFixed(1);

  //   // let [y1, x1, y2, x2] = boxes_data.slice(i * 4, (i + 1) * 4);
  //   // x1 *= ratios[0];
  //   // x2 *= ratios[0];
  //   // y1 *= ratios[1];
  //   // y2 *= ratios[1];

  //   // const width = x2 - x1;
  //   // const height = y2 - y1;

  //   // ctx.fillStyle = Colors.hexToRgba(color, 0.2) || color;
  //   // ctx.fillRect(x1, y1, width, height);

    
  //   // ctx.strokeStyle = color;
  //   // ctx.lineWidth = Math.max(Math.min(ctx.canvas.width, ctx.canvas.height) / 200, 2.5);
  //   // ctx.strokeRect(x1, y1, width, height);


  //   // ctx.fillStyle = color;
  //   // const label = `${klass} - ${score}%`;
  //   // const textWidth = ctx.measureText(label).width;
  //   // const textHeight = fontSize;
  //   // const yText = y1 - (textHeight + ctx.lineWidth);

  //   // ctx.fillRect(
  //   //   x1 - 1,
  //   //   yText < 0 ? 0 : yText,
  //   //   textWidth + ctx.lineWidth,
  //   //   textHeight + ctx.lineWidth
  //   // );

  //   // ctx.fillStyle = "#ffffff";
  //   // ctx.fillText(label, x1 - 1, yText < 0 ? 0 : yText);
  // }


};

class Colors {
  palette: string[];
  n: number;

  constructor() {
    this.palette = [
      "#FF3838", "#FF9D97", "#FF701F", "#FFB21D", "#CFD231",
      "#48F90A", "#92CC17", "#3DDB86", "#1A9334", "#00D4BB",
      "#2C99A8", "#00C2FF", "#344593", "#6473FF", "#0018EC",
      "#8438FF", "#520085", "#CB38FF", "#FF95C8", "#FF37C7",
    ];
    this.n = this.palette.length;
  }

  get = (i: number): string => {
    return this.palette[Math.floor(i) % this.n];
  };

  static hexToRgba = (hex: string, alpha: number): string | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${[
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ].join(", ")}, ${alpha})`
      : null;
  };
}
