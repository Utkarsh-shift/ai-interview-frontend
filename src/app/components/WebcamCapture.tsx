// "use client";

// import React, { useRef, useEffect, useState } from "react";
// import Webcam from "react-webcam";

// const FRAME_INTERVAL = 3000000;

// const WebcamCapture = () => {
//   const webcamRef = useRef<Webcam | null>(null);
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const [isStreaming, setIsStreaming] = useState(true);

//   useEffect(() => {
//     if (!isStreaming) return;

//     console.log("Webcam streaming started...");

//     const captureFrame = () => {
//       if (!webcamRef.current || !canvasRef.current) return;

//       const video = webcamRef.current.video;
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext("2d");

//       if (video && ctx) {
//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//         const base64Image = canvas.toDataURL("image/jpeg");

//         console.log("📸 Captured a frame! Sending to API...");
//         sendFrame(base64Image);
//       }
//     };

//     // Capture 1 frame every 5 seconds
//     const interval = setInterval(captureFrame, FRAME_INTERVAL);

//     return () => {
//       clearInterval(interval);
//       ////console.log("Webcam streaming stopped.");
//     };
//   }, [isStreaming]);

//   const sendFrame = async (base64Frame: string) => {
//     try {
//       await fetch("/api/vision", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ base64Frame }),
//       });

//       ////console.log("✅ Frame sent successfully!");
//     } catch (error) {
//       console.error("Error sending frame:", error);
//     }
//   };

//   return (
//     <div className="web-cam absolute top-2 right-2 p-2 bg-gray-800 rounded-lg shadow-lg z-50">
//       <Webcam ref={webcamRef} className="rounded-lg" width={200} height={150} />
//       <canvas ref={canvasRef} style={{ display: "none" }} />
//       <button
//         onClick={() => {
//           setIsStreaming(!isStreaming);
//           ////console.log(isStreaming ? "🛑 Stopping webcam..." : "▶️ Starting webcam...");
//         }}
//         className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg"
//       >
//         {isStreaming ? "Stop" : "Start"}
//       </button>
//     </div>
//   );
// };

// export default WebcamCapture;