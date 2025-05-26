
import "./video.css";
import html2canvas from 'html2canvas';
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import detectVideo from "../../utils/detect1";

import hotkeys from "hotkeys-js";

const Video = ({
  sessionId,
  cameraStream,
  screenStream,
  captureWindow = (message) => {},
  setIsShowExitFullScreenModal = () => {},
  setIsFullScreenMode = () => {},
  setProgress = () => {},
}) => {
  const [model, setModel] = useState({ net: null, inputShape: [1, 0, 0, 3] });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);

  const stopExistingStreams = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);



  const checkFullscreen = useCallback(() => {
    const isFullscreen = !!document.fullscreenElement;
    setIsShowExitFullScreenModal(!isFullscreen);
    if (!isFullscreen) captureWindow("Exited Full Screen");
  }, [captureWindow, setIsShowExitFullScreenModal]);

  const captureScreenshotAndStore = async(updated , window) => {
    const video = document.querySelector("video");
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const screenshotCanvas = await html2canvas(document.body); 
    const imageData = screenshotCanvas.toDataURL("image/png");

    fetch("/api/tab_switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id : sessionId,
        tabswitch_count :  updated,
        windowcount : 0, 
        image : imageData
      }),
    }).catch((err) => console.error("❌ Error storing screenshot:", err));
  };

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);
  
  useEffect(() => {

    

    if (!cameraStream || !model.net || !sessionId || !videoRef.current) {
      return;
    }
  
    videoRef.current.srcObject = cameraStream;
  
    detectVideo(videoRef.current, model, canvasRef, sessionId);
  }, [cameraStream, model.net, sessionId]);
  
  
  useEffect(() => {
    hotkeys(
      [
        "ctrl+t",
        "ctrl+n",
        "ctrl+shift+t",
        "ctrl+shift+n",
        "ctrl+shift+p",
        "ctrl+p",
        "command+t",
        "command+n",
        "command+shift+t",
        "command+shift+n",
        "command+shift+p",
        "command+p",
      ],
      (e) => {
        e.preventDefault();
        console.log("🚫 Hotkey blocked:", e.key);
      }
    );
    return () => {
      hotkeys.unbind();
    };
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", checkFullscreen);
    return () => document.removeEventListener("fullscreenchange", checkFullscreen);
  }, [checkFullscreen]);

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && [73, 74].includes(e.keyCode)) ||
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const requestFullScreen = useCallback(() => {
    const el = document.documentElement;
    const rfs =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;

    setIsFullScreenMode(false);
    setProgress(100);

    if (rfs) {
      rfs.call(el).catch((error) =>
        console.error("Error requesting full-screen mode:", error)
      );
    } else {
      console.warn("Fullscreen API is not supported.");
    }
  }, [setIsFullScreenMode, setProgress]);

  useEffect(() => {
    tf.ready().then(async () => {
      try {
        const yolov8 = await tf.loadGraphModel(
          `${window.location.origin}/yolov8n_web_model/model.json`,
          {
            onProgress: (f) =>
              console.log(` Model loading progress: ${(f * 100).toFixed(2)}%`),
          }
        );

        tf.tidy(() => yolov8.execute(tf.ones(yolov8.inputs[0].shape)));

        setModel({ net: yolov8, inputShape: yolov8.inputs[0].shape });

        console.log(" Model loaded successfully");
      } catch (error) {
        console.error("Error loading model:", error);
      }
    });
  }, []);
  

  return (
    <div className="content">
      {cameraError && <p className="error-message">Camera Error: {cameraError}</p>}
       <video
      autoPlay
      muted
      ref={videoRef}
      className="w-full h-full object-cover rounded-md"
      style={{height: '100vh',width: '100vw'}}
    />
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
    </div>
  );



};

export default Video;