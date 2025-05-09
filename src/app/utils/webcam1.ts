/**
 * Class to handle webcam
 */
export class Webcam {
    /**
     * Open webcam and stream it through video tag.
     * @param videoRef HTMLVideoElement - video tag reference
     */
    open = (videoRef: HTMLVideoElement): void => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: {
              facingMode: "environment",
            },
          })
          .then((stream: MediaStream) => {
            videoRef.srcObject = stream;
          })
          .catch((err: Error) => {
            console.error("Error accessing webcam:", err);

          });
      } else {
        alert("Can't open Webcam! getUserMedia not supported.");
      }
    };
  
    /**
     * Close opened webcam.
     * @param videoRef HTMLVideoElement - video tag reference
     */
    close = (videoRef: HTMLVideoElement): void => {
      const stream = videoRef.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
        });
        videoRef.srcObject = null;
      } else {
        alert("Please open Webcam first!");
      }
    };
  }
  