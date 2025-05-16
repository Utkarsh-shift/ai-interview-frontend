import * as tf from "@tensorflow/tfjs";
import labels from "./labels.json";

interface Model {
  net: tf.GraphModel;
  inputShape: number[];
}

const numClass: number = labels.length;

const preprocess = (
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  modelWidth: number,
  modelHeight: number
): [tf.Tensor4D, number, number] => {
  let xRatio: number = 1, yRatio: number = 1;

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source);
    const [h, w] = img.shape.slice(0, 2);
    const maxSize = Math.max(w, h);

    const imgPadded = img.pad([
      [0, maxSize - h],
      [0, maxSize - w],
      [0, 0],
    ]);

    xRatio = maxSize / w;
    yRatio = maxSize / h;

    return tf.image
      .resizeBilinear(imgPadded as tf.Tensor3D, [modelWidth, modelHeight])
      .div(255.0)
      .expandDims(0);
  });

  return [input as tf.Tensor4D, xRatio, yRatio];
};


export const detect = async (
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  model: Model,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  openaiSessionId: string,
  callback: () => void = () => {}
): Promise<void> => {
  if (!openaiSessionId) {
    console.error("No openaiSessionId provided to detect function!");
    return;
  }

  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);
  const [input] = preprocess(source, modelWidth, modelHeight);

  const res = model.net.execute(input);
  const transRes = Array.isArray(res) ? res[0].transpose([0, 2, 1]) : res.transpose([0, 2, 1]);

  const w = transRes.slice([0, 0, 2], [-1, -1, 1]);
  const h = transRes.slice([0, 0, 3], [-1, -1, 1]);
  const x1 = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2));
  const y1 = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2));

  const boxes = tf.concat([y1, x1, tf.add(y1, h), tf.add(x1, w)], 2).squeeze() as tf.Tensor2D;
  const rawScores = transRes.slice([0, 0, 4], [-1, -1, numClass]).squeeze([0]) as tf.Tensor2D;
  const scores = rawScores.max(1) as tf.Tensor1D;
  const classes = rawScores.argMax(1) as tf.Tensor1D;


  const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.45, 0.2);


  const gatheredBoxes = boxes.gather(nms, 0);
  const gatheredScores = scores.gather(nms, 0);
  const gatheredClasses = classes.gather(nms, 0);

  gatheredBoxes.dataSync();
  const scores_data = gatheredScores.dataSync();
  const classes_data = gatheredClasses.dataSync();

  gatheredBoxes.dispose();
  gatheredScores.dispose();
  gatheredClasses.dispose();
  nms.dispose();

  let personCount = 0;
  let cellPhoneDetected = false;

  for (let i = 0; i < scores_data.length; ++i) {
    const score = scores_data[i];
    const klass = labels[classes_data[i]];
    if (score > 0.85) {if (klass === "person") personCount++;}
    else if (klass === "cell phone") {cellPhoneDetected = true;}
  }

  if (personCount > 1 || cellPhoneDetected) {
    if (personCount > 1) {
      console.log("Multiple persons detected, the person count is " , personCount);
    } else if(cellPhoneDetected){
      console.log("Cell phone detected ");
    }
    else {console.log("both camera and person detected : ", personCount);}
    sendLiveData(canvasRef, personCount, cellPhoneDetected, openaiSessionId);
  }

  if (canvasRef.current) {
  }

  tf.dispose([res, transRes, boxes, scores, classes]);
  callback();
};


const captureTabSwitchScreenshot = (openaiSessionId: string): void => {
  const video = document.querySelector("video");
  const canvas = document.createElement("canvas");

  if (!video) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL("image/png");
  console.log("Captured tab switch screenshot , tab switch detected");
  fetch("/api/proctor-store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      openai_session_id: openaiSessionId, 
      image: imageData,
      count: 1,
      cell_phone_detected: false,
      tab_switch: "⚠️ Tab switch detected",
    }),
  }).catch((err) => console.error("Error sending tab-switch image:", err));
};


export const detectVideo = (
  vidSource: HTMLVideoElement,
  model: Model,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  openaiSessionId: string | null
): void => {
  const frameInterval = 1000;
  let lastFrameTime = Date.now();
  let animationFrameId: number;

  const detectFrame = async (): Promise<void> => {
    const currentTime = Date.now();
    if (currentTime - lastFrameTime >= frameInterval) {
      if (!vidSource || !vidSource.srcObject) {
        console.error("Video source is not available.");
        return;
      }
      if (vidSource.videoWidth === 0 || vidSource.videoHeight === 0) {
        console.warn("Video not ready yet.");
        return;
      }
      if (!canvasRef?.current) {
        console.error("Canvas reference is missing.");
        return;
      }

      // const base64Image = canvasRef.current.toDataURL("image/jpeg");
      // await sendFrame(base64Image);
      const validOpenaiSessionId = openaiSessionId || ""; 
      await detect(vidSource, model, canvasRef, validOpenaiSessionId, () => {
        lastFrameTime = currentTime;
      });
    }
    animationFrameId = requestAnimationFrame(detectFrame);
  };

  vidSource.onloadedmetadata = () => {
    detectFrame();
  };

  if (vidSource.readyState >= 2) {
    detectFrame();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const validOpenaiSessionId = openaiSessionId || ""; 
      captureTabSwitchScreenshot(validOpenaiSessionId); 
    }
  });

  window.addEventListener("beforeunload", () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    });
};
const sendLiveData = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  personCount: number,
  cellPhoneDetected: boolean,
  openaiSessionId: string 
): void => {
  if (!openaiSessionId || openaiSessionId.trim() === "") {
    console.error("Invalid openai_session_id, not sending live data");
    return;  
  }

  const canvas = document.createElement("canvas");
  const video = document.querySelector("video");

  if (!video) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL("image/png");

  
  if (!imageData || imageData.length < 100) {
    console.error("Image data is invalid or too small");
    return;
  }

  // console.log("Sending live data to server , Send Live data multiple persons detected");
  fetch("/api/proctor-store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      openai_session_id: openaiSessionId,  
      image: imageData,
      count: personCount,
      cell_phone_detected: cellPhoneDetected,
    }),
  }).catch((err) => console.error("Error sending live data:", err));
};


export default detectVideo;