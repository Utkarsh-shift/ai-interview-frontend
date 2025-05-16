"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { TranscriptItem } from "../types";
import { useTranscript } from "../contexts/TranscriptContext";

export interface TranscriptProps {
  userText: string;
  setUserText: (val: string) => void;
  onSendMessage: () => void;
  canSend: boolean;
}

function Transcript({
}: TranscriptProps) {
  const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const [visibleAssistantId, setVisibleAssistantId] = useState<string | null>(null);

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      }
    }

    setPrevLogs(transcriptItems);
  }, [transcriptItems]);

  useEffect(() => {
    const latest = [...transcriptItems]
      .filter((item) => item.role === "assistant" && item.type === "MESSAGE")
      .slice(-1)[0];
    if (latest?.itemId) setVisibleAssistantId(latest.itemId);
  }, [transcriptItems]);

  return (
    <div
      ref={transcriptRef}
      className="transcript_iner"
      style={{ scrollBehavior: "smooth" }}
    >
      {transcriptItems.map((item) => {
        const { itemId, type, role, data, expanded, title = "", isHidden } = item;

        if (isHidden) return null;

        if (role === "assistant" && type === "MESSAGE") {
          const isVisible = itemId === visibleAssistantId;
          return (
            <div
              key={itemId}
              className={`assistant-msg flex flex-col items-start transition-opacity duration-500 ease-in-out ${
                isVisible ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
              }`}
            >
              <div className="transscpt_p assistant relative bg-gray-900 text-gray-100">
                <ReactMarkdown>{title}</ReactMarkdown>
              </div>
            </div>
          );
        }

        // Avoid showing session id and timestamps
        if (
          type === "BREADCRUMB" &&
          (title.toLowerCase().includes("session") ||
            title.toLowerCase().includes("started at"))
        ) {
          return null;
        }

        if (type === "BREADCRUMB") {
          return (
            <div key={itemId} className="flex flex-col justify-start items-start text-sm text-gray-400">
              <div
                className={`whitespace-pre-wrap flex items-center font-mono text-sm ${
                  data ? "cursor-pointer text-gray-300" : "text-gray-500"
                }`}
                onClick={() => data && toggleTranscriptItemExpand(itemId)}
              >
                {data && (
                  <span
                    className={`mr-1 transform transition-transform duration-200 select-none font-mono ${
                      expanded ? "rotate-90" : "rotate-0"
                    }`}
                  >
                    ▶
                  </span>
                )}
                {title}
              </div>
              {expanded && data && (
                <div className="text-gray-200 text-left">
                  <pre className="border-l-2 ml-1 border-gray-500 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export default Transcript;
