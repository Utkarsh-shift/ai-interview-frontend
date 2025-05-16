let pc: RTCPeerConnection | null = null;

interface Answer {
  sessionid: string;
  sdp: string;
  type: string;
}

function negotiate(): Promise<Answer> {
  if (!pc) {
    console.error(" RTCPeerConnection not initialized");
    throw new Error('RTCPeerConnection not initialized');
  }
  
  pc.addTransceiver('video', { direction: 'recvonly' });
  pc.addTransceiver('audio', { direction: 'recvonly' });

  return pc.createOffer().then((offer: RTCSessionDescriptionInit) => {
    
    return pc!.setLocalDescription(offer);
  }).then(() => {
    
    return new Promise<void>((resolve) => {
      if (pc!.iceGatheringState === 'complete') {

        resolve();
      } else {
        const checkState = () => {
          if (pc!.iceGatheringState === 'complete') {
            pc!.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        pc!.addEventListener('icegatheringstatechange', checkState);
      }
    });
  }).then(() => {
    const offer = pc!.localDescription;
    const body = JSON.stringify({
      sdp: offer?.sdp,
      type: offer?.type
    });
    
    return fetch('https://neat-funny-coyote.ngrok-free.app/offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    });
  }).then(async (response: Response) => {
    const text = await response.text();
    

    try {
      const data: Answer = JSON.parse(text);
      
      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Failed to parse JSON:", e.message);
      } else {
        console.error("Failed to parse JSON:", e);
      }
      throw new Error("Invalid JSON response: " + text);
    }
  }).then((answer: Answer) => {
    const sessionidEl = document.getElementById('sessionid') as HTMLInputElement;
    if (sessionidEl) sessionidEl.value = answer.sessionid || '';
    

    return pc!.setRemoteDescription(answer as RTCSessionDescriptionInit).then(() => answer);
  }).catch((e: Error) => {
    console.error(" WebRTC error:", e);
    throw e;
  });
}

async function start(): Promise<Answer> {
  const config: RTCConfiguration = {
    
  };

  const useStunEl = document.getElementById('use-stun') as HTMLInputElement;
  if (useStunEl && useStunEl.checked) {
    config.iceServers = [{ urls: ['stun:stun.l.google.com:19302'] }];
    
  }
 
  pc = new RTCPeerConnection(config);
  

  pc.addEventListener('track', (evt: RTCTrackEvent) => {
    
    if (evt.track.kind === 'video') {
      const videoEl = document.getElementById('video') as HTMLVideoElement;
      if (videoEl) videoEl.srcObject = evt.streams[0];
    } else if (evt.track.kind === 'audio') {
      const audioEl = document.getElementById('audio') as HTMLAudioElement;
      if (audioEl) audioEl.srcObject = evt.streams[0];
      
    }
  });

  try {
    const data = await negotiate(); 

    const stopBtn = document.getElementById('stop') as HTMLElement;
    if (stopBtn) stopBtn.style.display = 'block';
    

    return data;
  } catch (err) {
    console.error("❌ Failed to start WebRTC:", err);
    throw err;
  }
}

function stop(): void {
  const stopBtn = document.getElementById('stop') as HTMLElement;
  if (stopBtn) stopBtn.style.display = 'none';

  setTimeout(() => {
    if (pc) {
      pc.close();
    }
  }, 500);
}


declare global {
  interface Window {
    start: () => Promise<Answer>;
  }
}

if (typeof window !== "undefined") {
  window.startPersonaOffer = start;

  window.onbeforeunload = (e: BeforeUnloadEvent) => {
    if (pc) pc.close();
    e = e || window.event;
    if (e) e.returnValue = 'close prompt';
    return 'close prompt';
  };

  window.start = start;
}

export { start, stop, negotiate };
