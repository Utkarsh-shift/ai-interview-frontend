"use client";

import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  togglePTTSpeaking: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (val: boolean) => void;
}

function BottomToolbar({
  sessionStatus,
  onToggleConnection,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  togglePTTSpeaking,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  return (
    <div className="w-full flex justify-center items-center fixed bottom-4 z-50 bottom_start_btn">
      <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center">
        <button
          onClick={togglePTTSpeaking}
          disabled={!isPTTActive}
          className={`ptt-button transition-all duration-300 text-sm sm:text-base font-semibold shadow-md ${
            !isPTTActive
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : isPTTUserSpeaking
              ? "active" 
              : ""
          }`}
        >
          {isPTTUserSpeaking ? "Stop Answering" : "Start Answering"}
        </button>
      </div>
    </div>
  );
}

export default BottomToolbar;
