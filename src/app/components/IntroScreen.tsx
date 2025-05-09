"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

interface IntroScreenProps {
  onProceed: (
    resumeData?: any,
    screenStream?: MediaStream | null,
    cameraStream?: MediaStream | null
  ) => void;
  setMicTrack: (track: MediaStreamTrack) => void;
  onRecordingStart: (stopRecording: () => Promise<void>) => void;
  onPermissionsGranted: (permissions: {
    camera: boolean;
    mic: boolean;
    screen: boolean;
  }) => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({
  onProceed,
  setMicTrack,
  onPermissionsGranted,
}) => {
  const [permissions, setPermissions] = useState({
    camera: false,
    mic: false,
    screen: false,
  });

  const [loading, setLoading] = useState({
    model: false,
    camera: false,
    mic: false,
    screen: false,
    startInterview: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 2500); // 2.5s splash screen
    return () => clearTimeout(timer);
  }, []);
  

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const [resumeData, setResumeData] = useState<any>(null);

  const getPermissionStatus = (granted: boolean, loading: boolean) => {
    if (loading) return "🔄 Processing...";
    return granted ? "✅ Granted" : "❌ Required";
  };

  const requestCameraPermission = async () => {
    try {
      setError(null);
      setLoading((prev) => ({ ...prev, camera: true }));
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = cameraStream;

      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
      }

      setPermissions((prev) => ({ ...prev, camera: true }));
      onPermissionsGranted({
        camera: true,
        mic: permissions.mic,
        screen: permissions.screen,
      });
    } catch (error) {
      console.error("Camera permission error:", error);
      setError("Camera permission denied. Please allow camera access.");
    } finally {
      setLoading((prev) => ({ ...prev, camera: false }));
    }
  };

  const requestMicPermission = async () => {
    try {
      setError(null);
      setLoading((prev) => ({ ...prev, mic: true }));
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = micStream.getAudioTracks()[0];
      if (audioTrack) {
        setMicTrack(audioTrack);
      }

      setPermissions((prev) => ({ ...prev, mic: true }));
      onPermissionsGranted({
        camera: permissions.camera,
        mic: true,
        screen: permissions.screen,
      });
    } catch (error) {
      console.error("Microphone permission error:", error);
      setError("Microphone permission denied. Please allow microphone access.");
    } finally {
      setLoading((prev) => ({ ...prev, mic: false }));
    }
  };

  const requestScreenPermission = async () => {
    try {
      setError(null);
      setLoading((prev) => ({ ...prev, screen: true }));
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 } });
      screenStreamRef.current = screenStream;

      setPermissions((prev) => ({ ...prev, screen: true }));
      onPermissionsGranted({
        camera: permissions.camera,
        mic: permissions.mic,
        screen: true,
      });
    } catch (error) {
      console.error("Screen sharing permission error:", error);
      setError("Screen sharing permission denied. Please allow screen sharing.");
    } finally {
      setLoading((prev) => ({ ...prev, screen: false }));
    }
  };

  const startInterview = async () => {
    try {
      if (permissions.camera && permissions.mic && permissions.screen) {
        setLoading((prev) => ({ ...prev, startInterview: true }));
        // You can await anything async here if needed
        await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate delay
        onProceed(resumeData, screenStreamRef.current, cameraStreamRef.current);
      } else {
        setError("Please grant all permissions to proceed.");
      }
    } catch (error) {
      console.error("Start interview error:", error);
      setError("Failed to start the interview. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, startInterview: false }));
    }
  };

  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !modelRef.current) {
      detectionIntervalRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    detectionIntervalRef.current = requestAnimationFrame(detectFaces);
  }, []);

  useEffect(() => {
    const initModel = async () => {
      try {
        setLoading((prev) => ({ ...prev, model: true }));
        await tf.setBackend("webgl");
        modelRef.current = await cocoSsd.load();
      } catch {
        setError("Failed to load AI model. Please refresh.");
      } finally {
        setLoading((prev) => ({ ...prev, model: false }));
      }
    };

    initModel();
    return () => {
      if (detectionIntervalRef.current)
        cancelAnimationFrame(detectionIntervalRef.current);
    };
  }, []);

  // Spinner SVG component
  const Spinner = () => (
    <svg
      className="w-5 h-5 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"></path>
    </svg>
  );

  if (showLoader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white p-6">
        <div className="animate-bounce mb-6">
          <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m4 0h-1a1 1 0 100 2h1a1 1 0 100-2z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2 animate-pulse">Preparing Interview Setup...</h1>
        <p className="text-center text-sm text-white/80">Loading resources, initializing permissions...</p>
      </div>
    );
  }
  

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-8">
        
          <h1 className="text-3xl font-bold text-center mb-4">Welcome to Your AI-Powered Interview</h1>
          <p className="text-center text-gray-600 mb-8">Please follow these important guidelines carefully before you begin:</p>
        
          <div className="flex mb-8">
            <img src="/home/almabay/Downloads/PIC.png" alt="Interview setup" className="w-1/2 h-auto object-cover rounded-md" />
            <div className="w-1/2 pl-8">
              <div className="w-full p-5 bg-yellow-100 border-l-4 border-yellow-500 rounded-md mb-4">
                <h2 className="text-xl font-semibold mb-2 text-yellow-800">Important Instructions</h2>
                <ul className="list-disc list-inside text-gray-800 space-y-2 text-sm">
                  <li>Ensure You are in a quiet, well-lit environment.</li>
                  <li>Use a laptop or desktop device. Mobile devices are not supported.</li>
                  <li>Make sure your webcam and microphone are fully functional.</li>
                  <li>A stable internet connection is mandatory.</li>
                </ul>
              </div>
    
              <div className="w-full p-5 bg-blue-100 border-l-4 border-blue-500 rounded-md mb-4">
                <h2 className="text-xl font-semibold mb-2 text-blue-800">During the Interview</h2>
                <ul className="list-disc list-inside text-gray-800 space-y-2 text-sm">
                  <li>The session will be recorded and monitored by AI.</li>
                  <li>You must stay in the frame and speak clearly.</li>
                  <li>Do not switch tabs, minimize the browser, or leave the interview window.</li>
                </ul>
              </div>
            </div>
          </div>
        
          <div className="w-full mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Permissions Required</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Camera Access</span>
                <span className="font-medium">{getPermissionStatus(permissions.camera, loading.camera)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Microphone Access</span>
                <span className="font-medium">{getPermissionStatus(permissions.mic, loading.mic)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Screen Sharing</span>
                <span className="font-medium">{getPermissionStatus(permissions.screen, loading.screen)}</span>
              </div>
            </div>
          </div>
    
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <button
              onClick={requestCameraPermission}
              disabled={loading.camera || permissions.camera}
              className={`flex-1 py-3 rounded-full text-white text-sm font-semibold transition-all duration-300 shadow-md ${
                loading.camera || permissions.camera
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-600 hover:scale-105"
              }`}
            >
              {loading.camera ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Requesting Camera...
                </span>
              ) : permissions.camera ? "✅ Camera Granted" : "📷 Allow Camera"}
            </button>
    
            <button
              onClick={requestMicPermission}
              disabled={loading.mic || permissions.mic}
              className={`flex-1 py-3 rounded-full text-white text-sm font-semibold transition-all duration-300 shadow-md ${
                loading.mic || permissions.mic
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-600 hover:scale-105"
              }`}
            >
              {loading.mic ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Requesting Mic...
                </span>
              ) : permissions.mic ? "✅ Microphone Granted" : "🎤 Allow Microphone"}
            </button>
    
            <button
              onClick={requestScreenPermission}
              disabled={loading.screen || permissions.screen}
              className={`flex-1 py-3 rounded-full text-white text-sm font-semibold transition-all duration-300 shadow-md ${
                loading.screen || permissions.screen
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-teal-500 hover:bg-teal-600 hover:scale-105"
              }`}
            >
              {loading.screen ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Requesting Screen...
                </span>
              ) : permissions.screen ? "✅ Screen Granted" : "🖥️ Allow Screen Sharing"}
            </button>
          </div>
    
          <button
            onClick={startInterview}
            disabled={
              !(permissions.camera && permissions.mic && permissions.screen) || loading.startInterview
            }
            className={`w-full py-4 rounded-full text-white text-lg font-bold transition-all duration-300 shadow-lg ${
              permissions.camera && permissions.mic && permissions.screen && !loading.startInterview
                ? "bg-green-500 hover:bg-green-600 hover:scale-105"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading.startInterview ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Starting...
              </span>
            ) : (
              "Start Interview"
            )}
          </button>
    
          <video ref={videoRef} autoPlay playsInline muted className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    );
   
  
};

export default IntroScreen;
