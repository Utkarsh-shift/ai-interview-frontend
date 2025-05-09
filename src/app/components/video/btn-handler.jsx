import { useState, useRef } from "react";
import { Webcam } from "../../utils/webcam";

const ButtonHandler = ({ imageRef, cameraRef, videoRef }) => {
  const [streaming, setStreaming] = useState(null); 
  const inputImageRef = useRef(null); 
  const inputVideoRef = useRef(null); 
  const webcam = new Webcam(); 
 

  return (
    <div className="btn-container">
     
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
          } else alert(`Can't handle more than 1 stream\nCurrently streaming : ${streaming}`); 
        }}
      >
        {streaming === "camera" ? "Close" : "Open"} Webcam
      </button>
    </div>
  );
};

export default ButtonHandler;
