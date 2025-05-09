import { useState, useRef } from "react";
import { Webcam } from "../utils/webcam";

const ButtonHandler = ({ imageRef, cameraRef, videoRef }) => {
  const [streaming, setStreaming] = useState(null); 
  const inputImageRef = useRef(null); 
  const inputVideoRef = useRef(null); 
  const webcam = new Webcam(); 


  const closeImage = () => {
    const url = imageRef.current.src;
    imageRef.current.src = "#";
    URL.revokeObjectURL(url); 

    setStreaming(null); 
    inputImageRef.current.value = ""; 
    imageRef.current.style.display = "none"; 
  };


  const closeVideo = () => {
    const url = videoRef.current.src;
    videoRef.current.src = ""; 
    URL.revokeObjectURL(url); 
    setStreaming(null); 
    inputVideoRef.current.value = "";
    videoRef.current.style.display = "none"; 
  };

  return (
    <div className="btn-container">
      {/* Image Handler */}
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const url = URL.createObjectURL(e.target.files[0]); 
          imageRef.current.src = url; 
          imageRef.current.style.display = "block"; 
          setStreaming("image"); 
        }}
        ref={inputImageRef}
      />
      <button
        onClick={() => {
          
          if (streaming === null) inputImageRef.current.click();
         
          else if (streaming === "image") closeImage();
          else console.log(`Can't handle more than 1 stream\nCurrently streaming : ${streaming}`); 
        }}
      >
        {streaming === "image" ? "Close" : "Open"} Image
      </button>

      {/* Video Handler */}
      <input
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (streaming === "image") closeImage(); 
          const url = URL.createObjectURL(e.target.files[0]); 
          videoRef.current.src = url; 
          videoRef.current.addEventListener("ended", () => closeVideo()); 
          videoRef.current.style.display = "block";
          setStreaming("video"); 
        }}
        ref={inputVideoRef}
      />
      <button
        onClick={() => {

          if (streaming === null || streaming === "image") inputVideoRef.current.click();
           
          else if (streaming === "video") closeVideo();
          else console.log(`Can't handle more than 1 stream\nCurrently streaming : ${streaming}`); // if streaming webcam
        }}
      >
        {streaming === "video" ? "Close" : "Open"} Video
      </button>

      <button
        onClick={() => {
          
          if (streaming === null || streaming === "image") {
           
            if (streaming === "image") closeImage();
            webcam.open(cameraRef.current);
            cameraRef.current.style.display = "block"; 
            setStreaming("camera"); 
          }
          
          else if (streaming === "camera") {
            webcam.close(cameraRef.current);
            cameraRef.current.style.display = "none";
            setStreaming(null);
          } else console.log(`Can't handle more than 1 stream\nCurrently streaming : ${streaming}`); 
        }}
      >
        {streaming === "camera" ? "Close" : "Open"} Webcam
      </button>
    </div>
  );
};

export default ButtonHandler;