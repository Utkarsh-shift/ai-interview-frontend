import { RefObject } from "react";

export async function createRealtimeConnection(
  EPHEMERAL_KEY: string,
  audioElement: RefObject<HTMLAudioElement | null>
): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
  

  const pc = new RTCPeerConnection();


  pc.ontrack = (e) => {
    const remoteStream = e.streams[0];
    const audioEl = audioElement.current;
  
    if (audioEl && remoteStream) {
   
      audioEl.srcObject = remoteStream;
  
      audioEl.onloadedmetadata = () => {
        if (audioEl && audioEl.srcObject) {
          audioEl
            .play()
            .then(() => {
              console.log(" Audio playback started after metadata loaded");
            })
            .catch((err) => {
              console.warn(" Audio play failed:", err);
            });
        }
      };
    }
  };
  
  try {
    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTrack = ms.getAudioTracks()[0];
  
    if (audioTrack) {
      pc.addTrack(audioTrack);
      console.log("🎤 Real microphone track added.");
    } else {
      throw new Error("No audio track found.");
    }
  } catch (error) {
    console.warn("⚠️ Using dummy audio track due to mic error:", error);
  
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const dest = audioContext.createMediaStreamDestination();
  
    oscillator.connect(dest);
    oscillator.start();
  
    const dummyTrack = dest.stream.getAudioTracks()[0];
    pc.addTrack(dummyTrack);
  
    console.log(" Dummy audio track added.");
  }
  
  const dc = pc.createDataChannel("oai-events");

  const offer = await pc.createOffer();

  await pc.setLocalDescription(offer);

  const baseUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-mini-realtime-preview-2024-12-17";

  const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${EPHEMERAL_KEY}`,
      "Content-Type": "application/sdp",
    },
  });
  

  if (!sdpResponse.ok) {
    console.error("Failed to receive SDP response from OpenAI:", sdpResponse.status, await sdpResponse.text());
    throw new Error("SDP response failed.");
  }
  const answerSdp = await sdpResponse.text();
  const answer: RTCSessionDescriptionInit = {
    type: "answer",
    sdp: answerSdp,
  };

  try {
    await pc.setRemoteDescription(answer);
  } catch (error) {
    console.error("Error setting remote description:", error);
  }
  return { pc, dc };
}
