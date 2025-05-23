"use client";
import  {useNetworkStatus}  from "./components/networkstatus/network_status";
import MultipleMonitorsDetected from "./components/MutipleMonitorsDetected";
import Events from "./components/Events";
import html2canvas from 'html2canvas';
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import Transcript from "./components/Transcript";
import BottomToolbar from "./components/BottomToolbar";
import { AgentConfig, SessionStatus } from "./types";
import { useTranscript } from "../app/contexts/TranscriptContext";
import { useEvent } from "../app/contexts/EventContext";
import { useHandleServerEvent } from "./hooks/useHandleServerEvent";
import { createRealtimeConnection } from "./lib/realtimeConnection";
import { getAllAgentSets, defaultAgentSetKey } from "../app/agentConfigs";
import Video from "./components/video/Video";
import hotkeys from "hotkeys-js";
import IntroScreen from "./components/IntroScreen";
// import WebRTCComponent from "./components/web_Component";
import { getGlobalSessionId } from "../app/contexts/TranscriptContext";
import getAgents from "../app/agentConfigs/frontDeskAuthentication";
import { toast } from "react-toastify";

type AppProps = {
  batch_id: string;
  job_id: string;
};

declare global {
  interface Window {
    startPersonaOffer?: () => void;
  }
}


interface StudentData {
  student_name: string;
  education: string;
  student_experience: string;
  certfication: string[];
  skills: string;
  projects: string[];
  selected_language: string;
  agent: string;
  job_id: string;
  created_at: string;
  updated_at: string;
}

function App({ batch_id }: AppProps) {
  const [permissions, setPermissions] = useState({
    camera: false,
    mic: false,
    screen: false
  });
  const [showIntro, setShowIntro] = useState(true);
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");

  const screenMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isScreenRecordingRef = useRef(false);
  const screenCaptureStream = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isRequestMade, setIsRequestMade] = useState(false); 
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLoading] = useState({ loading: true, progress: 0 }); 
  const [, setModel] = useState<{ net: tf.GraphModel | null; inputShape: number[] }>({
    net: null,
    inputShape: [1, 0, 0, 3],
  });
  const [isMonitorExtended, setIsMonitorExtended] = useState(false);

  const [, setHasWarnedOnce] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const recordingIdRef = useRef(`${Date.now()}`);
  const modelName = "yolov8n";
  const { transcriptItems, addTranscriptMessage} =
    useTranscript();

  const { logClientEvent, logServerEvent } = useEvent();

  const [interviewStarted, setInterviewStarted] = useState(false);

  const [selectedAgentName, setSelectedAgentName] = useState<string>("");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] =
    useState<AgentConfig[] | null>(null);


  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [sessionId, setSessionId] = useState<string>("");

  const match = transcriptItems[0]?.title?.match(/session\.id:\s(\S+)/);
  const openaiId = match?.[1];


  const [isEventsPaneExpanded, setIsEventsPaneExpanded] =
    useState<boolean>(false);
  const [userText, setUserText] = useState<string>("");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(true);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] =
    useState<boolean>(true);
  const stopRecordingRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const micStreamRef = useRef<MediaStream | null>(null);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState(false);
  const isRecordingRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;

    const tryStart = () => {
      if (!iframe || !iframe.contentWindow) return;
      try {
        iframe.contentWindow.startPersonaOffer?.();
      } catch (e) {
        console.error("Failed to trigger startPersonaOffer:", e);
      }
    };

    iframe?.addEventListener("load", tryStart);
    return () => iframe?.removeEventListener("load", tryStart);
  }, []);

  const [showPermissionWarning, setShowPermissionWarning] = useState(false);
  const [permissionWarningMessage, setPermissionWarningMessage] = useState("");
  const permissionMonitorIntervalRef = useRef<NodeJS.Timeout | null>(null)


  useEffect(() => {
    if (!interviewStarted) return;
  
    const checkStreamsReady = () =>
      cameraStreamRef.current &&
      micStreamRef.current &&
      screenCaptureStream.current;
  
    const waitForStreams = setInterval(() => {
      if (checkStreamsReady()) {
        clearInterval(waitForStreams);
  
        permissionMonitorIntervalRef.current = setInterval(async () => {
          const cameraActive = cameraStreamRef.current
            ?.getVideoTracks()
            .some((track) => track.readyState === "live")
          const screenActive = screenCaptureStream.current
            ?.getVideoTracks()
            .some((track) => track.readyState === "live");
 
  
          if (!cameraActive || !screenActive) {
            console.warn(" Permission revoked - auto-submitting interview");
  
            try {
              await fetch("/api/store_transcript", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcriptItems }),
              });
            } catch (err) {
              console.error(" Error saving transcript before auto-submit:", err);
            }
  
            toast.error("Permissions revoked. Interview is being auto-submitted.");
            setInterviewEnded(true);
            window.location.href = "/feedback";
          }
        }, 2000);
      } else {
        console.log(" Waiting for all media streams to initialize...");
      }
    }, 500);
  
    return () => {
      clearInterval(waitForStreams);
      if (permissionMonitorIntervalRef.current) {
        clearInterval(permissionMonitorIntervalRef.current);
      }
    };
  }, [interviewStarted]);
  
  const retryPermissions = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      // const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  
      cameraStreamRef.current = cameraStream;
      // micStreamRef.current = micStream;
      screenCaptureStream.current = screenStream;
  
      setShowPermissionWarning(false);
      toast.success("Permissions restored. You may continue the interview.");
    } catch (err) {
      console.error("Error restoring permissions:", err);
      setPermissionWarningMessage("Failed to restore permissions. Please try again.");
    }
  };
  

  ///////////////////////////////////////////////////////


  const handleSessionEnd = useCallback(async () => {
    try {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      await stopScreenRecording();

      await stopRecordingRef.current();

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      setSessionStatus("DISCONNECTED");
    } catch (error) {
      console.error(" Error ending session:", error);
    }
  }, []);



  useEffect(() => {
    if (typeof window === "undefined") return;

if (!audioElementRef.current) {
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.muted = false;
  audio.volume = 1;
  document.body.appendChild(audio); // ensure it's in DOM for autoplay policies
  audioElementRef.current = audio;
}

  }, []);


  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();



      if (!EPHEMERAL_KEY) {
        return;
      }

      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
      }
      audioElementRef.current.autoplay = isAudioPlaybackEnabled;

      const { pc, dc } = await createRealtimeConnection(
        EPHEMERAL_KEY,
        audioElementRef
      );
      pcRef.current = pc;
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        logClientEvent({}, "data_channel.open");
      });
      dc.addEventListener("close", () => {
        logClientEvent({}, "data_channel.close");
      });
      dc.addEventListener("error", (err: any) => {
        logClientEvent({ error: err }, "data_channel.error");
      });
      dc.addEventListener("message", async (e: MessageEvent) => {
        try {
          const parsedData = JSON.parse(e.data);
          handleServerEventRef.current(parsedData);
        } catch (error) {
          console.error("Failed to parse AI response or send to avatar:", error);
        }
      });



      setDataChannel(dc);
    } catch (err) {
      console.error("Error connecting to realtime:", err);
      setSessionStatus("DISCONNECTED");
    }
  };




  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    if (dcRef.current && dcRef.current.readyState === "open") {
      logClientEvent(eventObj, eventNameSuffix);
      dcRef.current.send(JSON.stringify(eventObj));
    } else {
      logClientEvent(
        { attemptedEvent: eventObj.type },
        "error.data_channel_not_open"
      );
      console.error(
        "Failed to send message - no data channel available",
        eventObj
      );
      if (sessionStatus === "DISCONNECTED") {
        connectToRealtime();
        handleSessionEnd();
      }
    }
  };


  const handleServerEventRef = useHandleServerEvent({
    setSessionStatus,
    selectedAgentName,
    selectedAgentConfigSet,
    sendClientEvent,
    setSelectedAgentName,
  });

  useEffect(() => {
    if (!interviewStarted) return;
  
    const requestFullscreen = () => {
      const el = document.documentElement as any;
      const rfs =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen;
  
      if (rfs) {
        rfs.call(el).catch((err: unknown) => {
          console.error("Fullscreen request failed:", err);
        });
      } else {
        console.warn("Fullscreen API not supported.");
      }
    };
  
    const handleClickToGoFullscreen = () => {
      requestFullscreen();
      window.removeEventListener("click", handleClickToGoFullscreen);
    };
  
    window.addEventListener("click", handleClickToGoFullscreen);
  
    return () => {
      window.removeEventListener("click", handleClickToGoFullscreen);
    };
  }, [interviewStarted]);
  


  const [interviewEnded, setInterviewEnded] = useState(false);




  useEffect(() => {
    if (interviewEnded) {
      stopScreenRecording();
      stopVideoRecording();
      disconnectFromRealtime();
    }
  }, [interviewEnded]);




useEffect(() => {
  const loadAgents = async () => {
    const allAgentSets = await getAllAgentSets();
    let finalAgentConfig = searchParams.get("agentConfig");

    if (!finalAgentConfig || !(finalAgentConfig in allAgentSets)) {
      finalAgentConfig = defaultAgentSetKey;
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("agentConfig", finalAgentConfig);
      window.history.replaceState({}, "", newUrl.toString());
    }

    const agents = allAgentSets[finalAgentConfig as keyof typeof allAgentSets];
    const agentKeyToUse = agents.agentsList?.[0]?.name || "";

    setSelectedAgentName(agentKeyToUse);
    setSelectedAgentConfigSet(agents.agentsList);
  };

  loadAgents();
}, [searchParams]);





  useEffect(() => {
    if (selectedAgentName && sessionStatus === "DISCONNECTED") {
      connectToRealtime();
      handleSessionEnd();
    }
  }, [selectedAgentName]);

useEffect(() => {
  if (
    sessionStatus === "CONNECTED" &&
    selectedAgentConfigSet &&
    selectedAgentName
  ) {
    updateSession();
  }
}, [selectedAgentConfigSet, selectedAgentName, sessionStatus]);


  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      console.log(
        `updatingSession, isPTTACtive=${isPTTActive} sessionStatus=${sessionStatus}`
      );
      updateSession();
    }
  }, [isPTTActive]);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/session");
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };
  const requestFullscreen = useCallback(() => {
    const el = document.documentElement as any;
    const rfs =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;
  
    if (rfs) {
      const result = rfs.call(el);
      if (result && typeof result.then === "function") {
        result.catch((err: unknown) => {
          console.warn(" Fullscreen request failed (Promise):", err);
        });
      }
    } else {
      console.warn(" Fullscreen API not supported.");
    }
  }, []);
  


  /////////////////////////////////////////////////
  useEffect(() => {
    const handleAutoConclude = (event: Event) => {
      const customEvent = event as CustomEvent<{ summary: string; closing_statement: string }>;
      console.log(" Auto-detected interview end from assistant:", customEvent.detail);

      handleSessionEnd();
      sendClientEvent({
        type: "interview.concluded",
        sessionId,
        timestamp: new Date().toISOString(),
      }, "interview_concluded");

      setInterviewEnded(true);
    };

    window.addEventListener("interviewConcluded", handleAutoConclude);

    return () => {
      window.removeEventListener("interviewConcluded", handleAutoConclude);
    };
  }, [sessionId, handleSessionEnd]);


  /////////////////////////////////////////////////////////// 

  const uploadChunk = async (chunk: Blob, partType: string) => {
    const match = transcriptItems[0]?.title?.match(/session\.id:\s(\S+)/);
    const openaiId = match?.[1];
    if (!openaiId) {
      console.error("Failed to extract openaiId");
      return;
    }

    const formData = new FormData();
    formData.append("uploadFile", chunk);
    formData.append("part_type", partType);
    formData.append("recording_id", recordingIdRef.current);

    formData.append("session_id", openaiId);

    formData.append("type", "Pending_camera");

    try {
      await fetch("/api/upload-chunk", {
        method: "POST",
        body: formData,
      });
      console.log("Camera chunk Uploaded successfully");

    } catch (err) {
      console.error("Camera upload error:", err);
    }
  };



  const getSupportedMimeType = () => {
    const possibleTypes = [
      'video/webm',
    ];
  
    for (const type of possibleTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(` Using supported mimeType: ${type}`);
        return type;
      }
    }
  
    console.warn(' No supported mimeType found, falling back to default.');
    return '';
  };

  

  const startVideoRecording = async () => {
    try {
      let stream = cameraStreamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: 30 },
          audio: true,
        });
      }
  
      mediaStreamRef.current = stream;
      isCameraRecordingRef.current = true;
  
      const mimeType = getSupportedMimeType();
  
      const recordChunk = () => {
        if (!isCameraRecordingRef.current) return;
        try {
          const recorder = new MediaRecorder(stream!, mimeType ? { mimeType } : undefined);
          mediaRecorderRef.current = recorder;
  
          const chunkData: Blob[] = [];
  
          recorder.onstart = () => console.log("📷 Camera recorder started");
  
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunkData.push(event.data);
            }
          };
  
          recorder.onstop = async () => {
            if (chunkData.length > 0) {
              const blob = new Blob(chunkData, { type: mimeType });
              await uploadChunk(blob, "part");
            }
            chunkData.length = 0;
  
            if (isCameraRecordingRef.current) {
              setTimeout(recordChunk, 100);
            }
          };
  
          recorder.onerror = (e) => {
            console.error("Camera MediaRecorder error:", e.error);
          };
  
          recorder.start();
          setTimeout(() => {
            if (recorder.state === "recording") {
              recorder.stop();
            }
          }, CHUNK_DURATION);
  
        } catch (err) {
          console.error("Camera recording failed to start chunk loop:", err);
        }
      };
  
      recordChunk();
      console.log("🎥 Started camera recording");
  
    } catch (err) {
      console.error("❌ Failed to start camera recording:", err);
    }
  };
  

  
  const stopVideoRecording = async (): Promise<Blob | null> => {
    isCameraRecordingRef.current = false;
  
    return new Promise((resolve) => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        const chunks: Blob[] = [];
  
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            console.log("Final camera chunk received:", event.data.size);
            chunks.push(event.data);
          }
        };
  
        mediaRecorderRef.current.onstop = async () => {
          console.log("Camera MediaRecorder stopped");
  
          const blob = new Blob(chunks, { type: 'video/webm' });
          try {
            await uploadChunk(blob, "final");
            resolve(blob);
          } catch (err) {
            console.error("Camera final chunk upload failed:", err);
            resolve(null);
          }
  
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
          }
        };
  
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } else {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        resolve(null);
      }
    });
  };



  const screenChunkIndexRef = useRef(1);

  const uploadScreenChunk = async (chunk: Blob, type: string, partType: string) => {
    const formData = new FormData();
    const match = transcriptItems[0]?.title?.match(/session\.id:\s(\S+)/);
    const openaiId = match?.[1];
    if (!openaiId) {
      console.error("Failed to extract openaiId");
      return;
    }
    formData.append("uploadFile", chunk);
    formData.append("part_type", partType);
    formData.append("recording_id", recordingIdRef.current);
    formData.append("session_id", openaiId + "_screen");
    formData.append("type", "screen");
 
    const endpoint = "/api/upload-chunk";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
      console.log(`[screen] Uploaded chunk #${screenChunkIndexRef.current}`);
      screenChunkIndexRef.current += 1;
      return await res.json();
    } catch (err) {
      console.error(`[screen] Upload error:`, err);
      throw err;
    }
  };


  const CHUNK_DURATION = 14000;
  const [sharedScreenStream, setSharedScreenStream] = useState<MediaStream | null>(null);


  const isCameraRecordingRef = useRef(false);


  const startScreenRecording = async (stream: MediaStream) => {
    try {
      if (!stream) {
        console.error(" No screen stream provided");
        return;
      }
  
      screenCaptureStream.current = stream;
  
      const recordChunk = () => {
        if (!isRecordingRef.current) return;
      
        const tracks = stream.getVideoTracks();
        console.log("Screen stream tracks:", tracks.map(t => ({
          readyState: t.readyState,
          enabled: t.enabled,
          kind: t.kind
        })));
      
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        screenMediaRecorderRef.current = recorder;
        let chunkData: Blob[] = [];
      
        recorder.onstart = () => {
          console.log(" Screen recorder started");
        };
      
        recorder.ondataavailable = (event) => {
          console.log("screen dataavailable:", event.data?.size);
          if (event.data.size > 0) {
            chunkData.push(event.data);
          }
        };
      
        recorder.onerror = (e) => {
          console.error("Screen recorder error:", e.error);
        };
      
        recorder.onstop = async () => {
          console.log("Screen recorder stopped. Uploading chunk...");
          if (chunkData.length > 0) {
            const blob = new Blob(chunkData, { type: 'video/webm' });
            try {
              await uploadScreenChunk(blob, "scr_rec", "Part");
            } catch (err) {
              console.error("Failed to upload screen chunk:", err);
            }
            chunkData = [];
          }
      
          if (isRecordingRef.current) {
            setTimeout(recordChunk, 100);
          }
        };
      
        recorder.start();
      
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.requestData(); 
            recorder.stop();
          }
        }, CHUNK_DURATION);
      };
      
  
      isRecordingRef.current = true;
      recordChunk();
      setIsRecording(true);
      console.log("Screen recording started");
  
    } catch (error) {
      console.error("Failed to start screen recording:", error);
    }
  };

  


  
  
  const stopScreenRecording = async (): Promise<Blob | null> => {
    isScreenRecordingRef.current = false;
  
    return new Promise((resolve) => {
      if (
        screenMediaRecorderRef.current &&
        screenMediaRecorderRef.current.state === "recording"
      ) {
        const chunks: Blob[] = [];
  
        screenMediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            console.log("Final screen chunk received:", event.data.size);
            chunks.push(event.data);
          }
        };
  
        screenMediaRecorderRef.current.onstop = async () => {
          console.log("Screen MediaRecorder stopped");
  
          const blob = new Blob(chunks, { type: 'video/webm' });
          try {
            await uploadScreenChunk(blob, "scr_rec", "Final");
            resolve(blob);
          } catch (err) {
            console.error("Screen final chunk upload failed:", err);
            resolve(null);
          }
  
          if (screenCaptureStream.current) {
            screenCaptureStream.current.getTracks().forEach((track) => track.stop());
            screenCaptureStream.current = null;
          }
        };
  
        screenMediaRecorderRef.current.requestData();
        screenMediaRecorderRef.current.stop();
      } else {
        if (screenCaptureStream.current) {
          screenCaptureStream.current.getTracks().forEach((track) => track.stop());
          screenCaptureStream.current = null;
        }
        resolve(null);
      }
    });
  };
  
  useEffect(() => {
    if (sessionStatus === "CONNECTED" && permissions.camera) {
      startVideoRecording();
    }
  }, [sessionStatus, permissions.camera]);
  
  useEffect(() => {
    if (sessionStatus === "CONNECTED" && permissions.screen && sharedScreenStream) {
      startScreenRecording(sharedScreenStream);
    }
  }, [sessionStatus, permissions.screen, sharedScreenStream]);
  

// useEffect(() => {
//   if (sessionStatus === "CONNECTED" && permissions.screen && sharedScreenStream) {
//     const startRecordings = async () => {
//       try {
//         await startScreenRecording(sharedScreenStream);
//         if (permissions.camera) {
//           await startVideoRecording();
//         }
//       } catch (error) {
//         console.error("Error starting recordings:", error);
//       }
//     };

//     startRecordings();
//   }
// }, [sessionStatus, permissions.screen, permissions.camera, sharedScreenStream, sessionId]);



  useEffect(() => {
    const interval = setInterval(() => {
      setRecordingProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);
//////////////////////////////////////////////////////////////////////////////////////////////////



  useEffect(() => {
    if (sessionStatus !== "CONNECTED") return;

    const blockedKeys = [
      "ctrl+c",
      "ctrl+v",
      "ctrl+x",
      "ctrl+shift+i",
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
    ];

    hotkeys(blockedKeys.join(","), (event: KeyboardEvent) => {
      event.preventDefault();
      console.warn(" Hotkey blocked during interview:", event.key);
    });

    return () => {
      hotkeys.unbind(blockedKeys.join(","));
    };
  }, [sessionStatus]);

 
  ///////////////////////////////////////////////#####################################################

  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (!isOnline) {
      toast.error("You're offline! Please check your connection.");
    } else {
      toast.success("Back online! Your connection is restored.");
    }
  }, [isOnline]);

// to check if internet is desconnected

  /////////////////////////////
  useEffect(() => {
    const handleFullscreenChange = async () => {
      if (interviewEnded) return;
  
      if (interviewStarted && !document.fullscreenElement) {
        console.log("Fullscreen exited!");
  
        fullscreenExitCountRef.current += 1; 
  
        try {
          await captureWindow("Fullscreen exited"); 
        } catch {
  console.warn(" CaptureWindow failed during fullscreen exit. Ignoring.");
}
  
        if (fullscreenExitCountRef.current >= 3) {
          try {
            const firstMessage = transcriptItems.find((item) =>
              item.title?.toLowerCase().includes("session.id:")
            );
            const match = firstMessage?.title?.match(/session\.id:\s*(\S+)/);
            const openaiId = match?.[1];
  
            const requestBody: any = {
              transcriptItems,
            };
            if (openaiId) {
              requestBody.openaiId = openaiId;
            }
  
            await fetch("/api/store_transcript", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });
          } catch {
          console.warn("Could not save transcript during auto-submission, proceeding.");
        }
  
          toast.error(" You exited fullscreen 3 times. Interview is being auto-submitted.");
          window.location.href = "/feedback"; 
        } else {
          
          toast.warning(
            ` Warning: You exited fullscreen (${fullscreenExitCountRef.current}/3). Please stay in fullscreen to avoid auto-submission!`
          );
          setShowExitWarning(true);
          setHasWarnedOnce(true);
        }
      }
    };
  
    const handleVisibilityChange = () => {
      const isHidden = document.visibilityState === "hidden";
      isWindowHiddenRef.current = isHidden;
  
      if (isHidden) {
        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);
        captureWindow("Window Lost Focus (Tab Switch)");
      }
    };
  
    const handleWindowBlur = () => {
      if (document.visibilityState === "hidden") {
        isWindowHiddenRef.current = true;
        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);
        captureWindow("Window Lost Focus (Tab Switch)");
      }
    };
  
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
  
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [interviewStarted, interviewEnded, sessionStatus]);
  
  const tabSwitchCountRef = useRef(0); 
  const setTabSwitchCount = useState(0)[1];

  const isWindowHiddenRef = useRef(false); 
  
  const fullscreenExitCountRef = useRef(0);

  const captureWindow = async (message: string): Promise<void> => {
    const timestamp = new Date().toISOString();
  
    try {
      const screenshotCanvas = await html2canvas(document.body);
      const imageData = screenshotCanvas.toDataURL("image/png");
  
      await fetch("/api/tab_switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: openaiId,
          image_data: imageData,
          updated_at: timestamp,
          tabevent: message,
          tab_count: tabSwitchCountRef.current,
          fullscreen_exit_count: fullscreenExitCountRef.current,
        }),
      });
  
      console.log("Screenshot + event sent successfully");
    } catch (err) {
      console.error("Error capturing window screenshot:", err);
    }
  };
  

  const disconnectFromRealtime = () => {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track?.kind === "audio") {
          sender.track.stop(); 
          pcRef.current?.removeTrack(sender); 
        }
      });

      pcRef.current.close();
      pcRef.current = null;
    }
    setDataChannel(null);
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);

    logClientEvent({}, "disconnected");
  };


  const sendSimulatedUserMessage = async (text: string) => {
    const id = uuidv4().slice(0, 32);

    try {
  
      
      addTranscriptMessage(id, "user", text, true);
      sendClientEvent(
        {
          type: "conversation.item.create",
          item: {
            id: id,
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: text }],
          },
        },
        "(simulated user text message with vision data)"
      );
      sendClientEvent(
        { type: "response.create" },
        "(trigger response after simulated user text message)"
      );

    } catch (error) {
      console.error("Error fetching vision text:", error);
    }
  };


const updateSession = async () => {

  sendClientEvent(
    { type: "input_audio_buffer.clear" },
    "clear audio buffer on session update"
  );

  const currentAgent = selectedAgentConfigSet?.find(
    (a) => a.name === selectedAgentName
  );

  const turnDetection = isPTTActive
    ? null
    : {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 300,
        create_response: true,
      };

  const instructions = currentAgent?.instructions || "";
  const tools = currentAgent?.tools || [];

  const sessionUpdateEvent = {
    type: "session.update",
    session: {
      modalities: ["text", "audio"],
      instructions,
      voice: "coral",
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: { model: "whisper-1" },
      turn_detection: turnDetection,
      tools,
    },
  };

  sendClientEvent(sessionUpdateEvent);

};

 


useEffect(() => {
  const localToken = localStorage.getItem("authToken");
  const fallbackToken = process.env.NEXT_PUBLIC_TOKEN;

  const finalToken = localToken || fallbackToken || "";
  setToken(finalToken);
}, []);

useEffect(() => {
  if (token) {
    // Use the token in your logic
    console.log("Token available:", token);
  }
}, [token]);



useEffect(() => {
  const loadStudentAgent = async () => {
    try {
      const token =
        localStorage.getItem("authToken") || process.env.NEXT_PUBLIC_TOKEN;
      if (!token) throw new Error("No token");

const response = await fetch(
  `${process.env.NEXT_PUBLIC_BACKEND_NGROK_URL}/api/get-student-data/`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ batch_id: batch_id }),
  }
);


      if (!response.ok) throw new Error("Failed to fetch student data");

      const studentData: StudentData = await response.json();

      const agentKeyFromAPI = studentData.agent;

      const { agentsMap, agentsList } = await getAgents();
      console.log("📦 Loaded agentsMap keys:", Object.keys(agentsMap));

      if (!(agentKeyFromAPI in agentsMap)) {
        console.warn(`❗ Agent '${agentKeyFromAPI}' not found`);
        return;
      }

      const selectedAgent =
        agentsMap[agentKeyFromAPI as keyof typeof agentsMap];
      console.log("✅ Selected agent:", selectedAgent);

      setSelectedAgentName(selectedAgent.name);
      setSelectedAgentConfigSet(agentsList);
    } catch (err) {
      console.error("❌ Agent assignment failed:", err);
    }
  };

  loadStudentAgent();
}, []);











  const cancelAssistantSpeech = async () => {
    const mostRecentAssistantMessage = [...transcriptItems]
      .reverse()
      .find((item) => item.role === "assistant");

    if (!mostRecentAssistantMessage) {
      console.warn("can't cancel, no recent assistant message found");
      return;
    }
    if (mostRecentAssistantMessage.status === "DONE") {
      return;
    }

    sendClientEvent({
      type: "conversation.item.truncate",
      item_id: mostRecentAssistantMessage?.itemId,
      content_index: 0,
      audio_end_ms: Date.now() - mostRecentAssistantMessage.createdAtMs,
    });
    sendClientEvent(
      { type: "response.cancel" },
      "(cancel due to user interruption)"
    );
  };

  const handleSendTextMessage = async () => {
    if (!userText.trim()) return;

    cancelAssistantSpeech();
    try {
   
     
      const temp = userText.trim();
     
      const fullMessage = temp 

      addTranscriptMessage(uuidv4().slice(0, 32), "user", fullMessage, true);

      sendClientEvent(
        {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: fullMessage }],
          },
        },
        "(user text message with vision data)"
      );

      sendClientEvent({ type: "response.create" }, "trigger response");

    } catch (error) {
      console.error("Error fetching vision text:", error);
    }

    setUserText("");
  };



  const togglePTTSpeaking = () => {
    if (sessionStatus !== "CONNECTED" || dataChannel?.readyState !== "open") return;
  
    if (isPTTUserSpeaking) {
      setIsPTTUserSpeaking(false);
      sendClientEvent({ type: "input_audio_buffer.commit" }, "commit PTT");
      sendClientEvent({ type: "response.create" }, "trigger response PTT");
    } else {
      cancelAssistantSpeech();
      setIsPTTUserSpeaking(true);
      sendClientEvent({ type: "input_audio_buffer.clear" }, "clear PTT buffer");
    }
  };
  




  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      connectToRealtime();
    }
  };

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTActive(storedPushToTalkUI === "true");
    }
    const storedLogsExpanded = localStorage.getItem("logsExpanded");
    if (storedLogsExpanded) {
      setIsEventsPaneExpanded(storedLogsExpanded === "true");
    }
    const storedAudioPlaybackEnabled = localStorage.getItem(
      "audioPlaybackEnabled"
    );
    if (storedAudioPlaybackEnabled) {
      setIsAudioPlaybackEnabled(storedAudioPlaybackEnabled === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);



  useEffect(() => {
    const detectMultipleMonitors = () => {
      const screenX = window.screenX || window.screenLeft;
      const screenWidth = window.screen.width;

      const windowWidth = window.outerWidth;

  
     
  
      const isOutsidePrimaryScreen =
        screenX + windowWidth > screenWidth + 100 || screenX < -100;
  
      if (isOutsidePrimaryScreen) {
        console.log("We detected that your browser might be using multiple monitors.");
        setIsMonitorExtended(true);
      } else {
        setIsMonitorExtended(false);
      }
    };
  
    detectMultipleMonitors();
    window.addEventListener("resize", detectMultipleMonitors);
    return () => window.removeEventListener("resize", detectMultipleMonitors);
  }, []);
  



  useEffect(() => {
    if (openaiId) {
      localStorage.setItem("sessionId", openaiId);

    } else {
      console.warn("⚠️⚠️⚠️⚠️ No session ID found in transcript or localStorage. ⚠️⚠️⚠️⚠️");
    }

    if (openaiId) {
      setSessionId(openaiId);
    }
  }, [transcriptItems]);



  useEffect(() => {
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel(
        `${window.location.origin}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions });
          },
        }
      );


      const yoloshape = yolov8.inputs[0].shape;

      if (!yoloshape || yoloshape.some((dim) => dim === null || dim === undefined)) {
        throw new Error("Invalid model input shape detected.");
      }

      const dummyInput = tf.ones(yoloshape as number[]);

      yolov8.execute(dummyInput);

      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov8,
        inputShape: yolov8.inputs[0].shape ?? [1, 640, 640, 3],
      });


    });
  }, []);

  const [, setId] = useState('')
  useEffect(() => {

    const storedSessionId = localStorage.getItem("sessionId");
    if (storedSessionId) {
      setId(storedSessionId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "audioPlaybackEnabled",
      isAudioPlaybackEnabled.toString()
    );
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.play().catch((err) => {
          console.warn("Autoplay may be blocked by browser:", err);
        });
      } else {
        audioElementRef.current.pause();
      }
    }
  }, [isAudioPlaybackEnabled]);


  useEffect(() => {

    if (isSuccess) return;
    const sessionId = getGlobalSessionId();
    
    if (sessionId && openaiId  && batch_id) {
  
      fetch("/api/Lipsync_session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          openai_session_id: openaiId,
          batch_id : batch_id,
        }),
      })
        .then((res) => {
          if (res.status === 201) {
            setIsSuccess(true);
            console.log("Success: Session synced.");
          } else {
            console.log("Error: Failed to sync to DB, status:", res.status);
          }
        })
        .catch((err) => console.error(" Sync to DB failed:", err));


      setIsRequestMade(true);
    }
  }, [transcriptItems, isRequestMade, isSuccess,batch_id]);




  useEffect(() => {
    if (interviewEnded) {
      const timeout = setTimeout(() => {
        window.location.href = "/feedback";
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [interviewEnded]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
  
    if (isOnline) {
      timeout = setTimeout(() => {
      }, 4000);
    }
  
    return () => clearTimeout(timeout);
  }, [isOnline]);
  



  const agentSetKey = searchParams.get("agentConfig") || "default";
  const cameraStreamRef = useRef<MediaStream | null>(null);

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
      {showIntro ? (
        <IntroScreen
        
          onProceed={(resumeData, screenStream, cameraStream) => {
            setInterviewStarted(true);
            if (screenStream) setSharedScreenStream(screenStream);
            if (cameraStream) {
              micStreamRef.current = cameraStream;
              cameraStreamRef.current = cameraStream;
            }
            setShowIntro(false);
            if (permissions.camera && permissions.mic && permissions.screen) {
              setInterviewStarted(true);
              requestFullscreen();
              connectToRealtime();
            }
            if (resumeData) {
              const formatted = ``;
              sendSimulatedUserMessage(formatted);
            }
          }}
          setMicTrack={() => { }}
          onRecordingStart={(stopFn) => {
            stopRecordingRef.current = stopFn;
          }}
          onPermissionsGranted={(perms) => {
            setPermissions(perms);
          }}
        />
      ) : (
        <>
          {/* Top Navigation */}
          <div className="p-3 text-base font-semibold flex justify-between items-center bg-white shadow-md fixed top-0 left-0 w-full z-10">
            <div className="flex items-center">
              <div onClick={() => window.location.reload()} className="cursor-pointer flex items-center">
                <Image src="/PLACECOM LOGO SVG.svg" alt="Placecom Logo" width={80} height={80} className="mr-2" />
              </div>
              <div className="text-lg font-bold">
                Placecom Interviewer <span className="text-gray-500">Agents</span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {agentSetKey && (
                <div className="flex items-center space-x-2">

                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 mt-14">
            <div className="main_sec">
              <div className="upper_sec">
                <div className="model_comp">
                  {/* <WebRTCComponent /> */}
                </div>
                <div className="video_sec">
                  <div className="video_recor">
                    <Video
                      sessionId={openaiId}
                      cameraStream={cameraStreamRef.current}
                      screenStream={screenCaptureStream.current}
                    />
                  </div>
                </div>
              <div className="transcript">
                <Transcript
                  userText={userText}
                  setUserText={setUserText}
                  onSendMessage={handleSendTextMessage}
                  canSend={sessionStatus === "CONNECTED" && dcRef.current?.readyState === "open"}
                />

                <Events isExpanded={isEventsPaneExpanded} />
              </div>
              </div>
            </div>
          </div>

          {/* Warning Modal */}

          {showPermissionWarning && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm">
                <h2 className="text-xl font-bold text-red-600 mb-4">Permission Revoked</h2>
                <p className="text-gray-700 mb-4">{permissionWarningMessage}</p>
                <button
                  onClick={retryPermissions}
                  className="bg-green-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-700"
                >
                  Retry Permissions
                </button>
              </div>
            </div>
          )}


          {!isOnline && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm">
                <h2 className="text-xl font-bold text-red-600 mb-4">No Internet Connection</h2>
                <p className="text-gray-700 mb-4">
                  It looks like your internet is disconnected. Please check your connection.
                </p>
              </div>
            </div>
          )}

          {showExitWarning && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
                <h2 className="text-xl font-bold text-red-600 mb-4">Warning</h2>
                <p className="text-gray-800">
                  You exited fullscreen. If you do it again, the interview will end.
                </p>
                <button
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  onClick={() => {
                    setShowExitWarning(false);
                    requestFullscreen();
                  }}
                >
                  Return to Fullscreen
                </button>

                {isRecording && (
                  <div className="fixed bottom-20 right-4 bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    Recording
                    <span className="ml-2">{recordingProgress}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
      
      <div>
      <MultipleMonitorsDetected isOpen={isMonitorExtended} />
    </div>
 

          <div className="w-full bg-white shadow-md p-3 fixed bottom-0 left-0 z-10">
            <BottomToolbar
                sessionStatus={sessionStatus}
                onToggleConnection={onToggleConnection}
                isPTTActive={isPTTActive}
                setIsPTTActive={setIsPTTActive}
                isPTTUserSpeaking={isPTTUserSpeaking}
                togglePTTSpeaking={togglePTTSpeaking}
                isEventsPaneExpanded={isEventsPaneExpanded}
                setIsEventsPaneExpanded={setIsEventsPaneExpanded}
                isAudioPlaybackEnabled={isAudioPlaybackEnabled}
                setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default App;