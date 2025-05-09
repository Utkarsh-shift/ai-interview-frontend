"use client";
import React, { useEffect, useRef } from "react";

import {start} from './persona_start';
import { getFinalTranscript } from "@/app/contexts/TranscriptContext";

declare global {
  interface Window {
    sessionIdGlobal?: number;
  }
}

const 
WebRTCComponent = () => {
  const hasStartedRef = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initWebRTC = async () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      try {
        const data = await start();
        if (data?.sessionid) {
          console.log("✅ WebRTC session started with session ID:", data.sessionid);
          window.sessionIdGlobal = Number(data.sessionid);
        } else {
          console.warn("⚠️ No sessionid returned in response.");
        }
      } catch (err) {
        console.error("❌ Failed to start WebRTC:", err);
      }
    };

    initWebRTC();

    const handleFormSubmit = (e: Event) => {
      e.preventDefault();

      const message = getFinalTranscript();
      const sessionId = window?.sessionIdGlobal;

    };

    formRef.current = document.getElementById("echo-form") as HTMLFormElement;
    formRef.current?.addEventListener("submit", handleFormSubmit);

    return () => {
      formRef.current?.removeEventListener("submit", handleFormSubmit);
    };
  }, []);

  return (
    <div>

      <div id="media">
        <audio id="audio" autoPlay />
        <video
          id="video"
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            // position: "fixed",
            bottom: "20px",
            right: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            marginTop: "25px",
            marginRight: "25px",
          }}
        />
      </div>
    </div>
  );
};

export default WebRTCComponent;
