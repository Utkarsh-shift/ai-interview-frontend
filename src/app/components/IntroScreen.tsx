"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

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
    setClickedStartInterviewButton: (clicked: boolean) => void; 
}

const IntroScreen: React.FC<IntroScreenProps> = ({
  onProceed,
  setMicTrack,
  onPermissionsGranted,
   setClickedStartInterviewButton,
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
const [screenPermissionError, setScreenPermissionError] = useState(false);

  const [, setError] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 2500); 
    return () => clearTimeout(timer);
  }, []);
  
  const searchParams = useSearchParams();


  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const [resumeData] = useState<any>(null);


const [permissionMessage, setPermissionMessage] = useState<string | null>(null);


  const checkDeviceAvailability = async (kind: "videoinput" | "audioinput") => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.some((device) => device.kind === kind);
};



 const requestCameraPermission = async () => {
  try {
    setError(null);
    setLoading((prev) => ({ ...prev, camera: true }));

    const hasCamera = await checkDeviceAvailability("videoinput");
    if (!hasCamera) {
      const msg = "❌ No camera detected. Please connect a camera to continue.";
      setPermissionMessage(msg);
      setError(msg);
      return;
    }

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

    const hasMic = await checkDeviceAvailability("audioinput");
    if (!hasMic) {
      const msg = "❌ No microphone detected. Please connect a mic to continue.";
      setPermissionMessage(msg);
      setError(msg);
      return;
    }

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
      setScreenPermissionError(false);

      setPermissions((prev) => ({ ...prev, screen: true }));
      onPermissionsGranted({
        camera: permissions.camera,
        mic: permissions.mic,
        screen: true,
      });
    } catch (error) {
      setScreenPermissionError(true);
      console.error("Screen sharing permission error:", error);
      setError("Screen sharing permission denied. Please allow screen sharing.");
    } finally {
      setLoading((prev) => ({ ...prev, screen: false }));
    }
  };

const startInterview = async () => {
  try {
    setClickedStartInterviewButton(true);

    if (permissions.camera && permissions.mic && permissions.screen) {
      setLoading((prev) => ({ ...prev, startInterview: true }));


      const sessionId = localStorage.getItem("sessionId");
      if (sessionId) {
        await fetch("/api/Lipsync_session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            openai_session_id: sessionId,
            started_at: new Date().toISOString(),
          }),
        });
      }

      // 🔸 Delay for UX smoothness
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 🔸 Proceed to the interview
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


  useEffect(() => {
  if (permissionMessage) {
    const timer = setTimeout(() => setPermissionMessage(null), 5000);
    return () => clearTimeout(timer);
  }
}, [permissionMessage]);


if (showLoader) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center px-6 text-center">

      <Image
        src="/PLACECOM LOGO SVG.svg"
        alt="AlmaBay Logo"
        width={128}
        height={128} 
        className="w-24 md:w-32 mb-6 drop-shadow-md"
      />

      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
        Setting Up Your AI Interview Platform
      </h1>
      <p className="text-gray-600 mb-6 text-sm md:text-base">
        Please hold on while we prepare your personalized experience.
      </p>

      <div className="w-48 md:w-64 h-2 bg-gray-200 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 animate-loading-bar rounded-full" />
      </div>
    </div>
  );
}

  

return (

  
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
    <div className="w-full max-w-7xl space-y-10">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Welcome to AI-Powered Interview</h1>
        <p className="text-gray-600 text-md md:text-lg">
          Please follow this important guidelines carefully before you begin.
        </p>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 bg-white shadow-lg rounded-2xl p-8 space-y-6">
          <Image
            src="/pic intro.png"
            alt="Interview setup"
            width={800} 
            height={600} 
            className="w-full rounded-xl shadow-md"
          />
            

          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2 bg-orange-100 border-l-4 border-yellow-500 p-5 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">Important Instruction</h2>
              <div className="text-sm text-gray-800 space-y-1">
                <p>Ensure you are in a <strong>quiet, well-lit environment.</strong></p>
                <p>Use a <strong>laptop or desktop</strong> device. Mobile devices are not supported.</p>
                <p>Make sure your <strong>webcam and microphone</strong> are fully functional.</p>
                <p>A <strong>stable internet connection</strong> is mandatory.</p>
              </div>

              <h2 className="text-lg font-semibold text-yellow-800 mb-2 mt-4">During the Interview</h2>
              <div className="text-sm text-gray-800 space-y-1">
                <p>The session will be <strong> recorded and monitored</strong> by AI.</p>
                <p>You must <strong>stay in the frame</strong> and speak clearly.</p>
                <p>Do not switch tabs, minimize the browser, or leave the interview window.</p>
              </div>
            </div>

            {/* Right: During Interview + Prohibited Actions */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              {/* During Interview */}
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-5 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Warning</h2>
                <div className="text-sm text-gray-800 space-y-1">
                  <p>Exiting full screen or revoking camera/mic permissions will automatically terminate your interview and may render it invalid.</p>
                </div>
              </div>

              {/* Prohibited Actions */}
              <div className="bg-red-100 border-l-4 border-red-500 p-5 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-red-800 mb-2">🚫 Prohibited Actions</h2>
                <div className="text-sm text-gray-800 space-y-1">
                  <p>No third-party assistance (people, devices, notes).</p>
                  <p>Avoid background noise,interruptions, or multi-tasking.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section – Permissions and Start */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white shadow-lg rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Permissions Required</h2>

            {/* Reusable Permission Box */}
            {[
              {
                title: "Camera Access",
                description: "Allow access to your camera and microphone when prompted.",
                allowed: permissions.camera,
                onClick: requestCameraPermission
              },
              {
                title: "Microphone Access",
                description: "Allow access to your camera and microphone when prompted.",
                allowed: permissions.mic,
                onClick: requestMicPermission
              },
              {
                title: "Screen Sharing",
                description: "Do not disable or block webcam/microphone access during the session.",
                allowed: permissions.screen,
                error: screenPermissionError,
                onClick: requestScreenPermission
              }
            ].map(({ title, description, allowed, onClick, error }, index) => {
              const baseBorder = allowed ? "border-green-600" : error ? "border-red-600" : "border-blue-600";
              const baseBtnBorder = allowed ? "border-green-600 text-green-600" : error ? "border-red-600 text-red-600" : "border-blue-600 text-blue-600";

              return (
                <div key={index} className={`flex items-center justify-between border ${baseBorder} rounded-lg p-4 bg-white`}>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{title}</p>
                    <p>{description}</p>
                  </div>
                  <button
                    onClick={onClick}
                    disabled={allowed}
                    className={`ml-4 px-4 py-1 rounded-full text-sm font-semibold border ${baseBtnBorder} bg-white ${allowed ? "cursor-default" : "hover:bg-gray-50"}`}
                  >
                    {allowed ? "Allowed" : error ? "Retry" : "Allow"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Start Interview Block */}
          <div className="bg-green-50 shadow-lg rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-700 text-xl">✅</span>
              <h3 className="text-md font-semibold text-green-800">Ready to Begin?</h3>
            </div>
            <p className="text-sm text-gray-700">
              Once you click <strong>Start Interview</strong>, the session will commence immediately. Ensure all conditions above are met.
            </p>
            <button
              onClick={startInterview}
              disabled={!(permissions.camera && permissions.mic && permissions.screen) || loading.startInterview}
              className={`w-full py-3 rounded-full text-green-700 text-lg font-bold shadow-md transition border border-green-500 ${
                permissions.camera && permissions.mic && permissions.screen && !loading.startInterview
                  ? "bg-white hover:bg-gray-50"
                  : "bg-gray-200 cursor-not-allowed text-gray-500 border-gray-400"
              }`}
            >
              {loading.startInterview ? "Starting..." : "Start Interview"}
            </button>
          </div>

{permissionMessage && (
  <div className="w-full max-w-xl mx-auto mb-4 relative">
    <div className="relative flex items-start space-x-3 p-4 bg-red-50 border border-red-300 rounded-xl shadow-md animate-fade-in">
      <span className="text-red-600 text-xl mt-1"></span>


      <div className="text-sm text-red-700">{permissionMessage}</div>


    </div>
  </div>
)}

        </div>
      </div>
    </div>
  </div>
);

};

export default IntroScreen;
