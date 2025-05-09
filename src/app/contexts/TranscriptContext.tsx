"use client";
import React, {
  createContext,
  useContext,
  useState,
  FC,
  PropsWithChildren,
  useRef,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { TranscriptItem } from "@/app/types";


if (typeof window !== "undefined") {
  (window as any).shouldStopUploading = true;
}


declare global {
  interface Window {
    sessionIdGlobal?: number;
  }
}


type TranscriptContextValue = {
  transcriptItems: TranscriptItem[];
  addTranscriptMessage: (itemId: string, role: "user" | "assistant", text: string, hidden?: boolean) => void;
  updateTranscriptMessage: (itemId: string, text: string, isDelta: boolean) => void;
  addTranscriptBreadcrumb: (title: string, data?: Record<string, any>) => void;
  toggleTranscriptItemExpand: (itemId: string) => void;
  updateTranscriptItemStatus: (itemId: string, newStatus: "IN_PROGRESS" | "DONE") => void;
};

let finalTranscriptSnapshot = ""; 

export const getFinalTranscript = () => finalTranscriptSnapshot; 


const TranscriptContext = createContext<TranscriptContextValue | undefined>(undefined);

export const TranscriptProvider: FC<PropsWithChildren> = ({ children }) => {
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const fullTranscriptRef = useRef<string>(""); 

  const newTimestampPretty = () =>
    new Date().toLocaleTimeString([], {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });

  const addTranscriptMessage: TranscriptContextValue["addTranscriptMessage"] = (itemId, role, text = "", isHidden = false) => {
    setTranscriptItems((prev) => {
      if (prev.some((log) => log.itemId === itemId && log.type === "MESSAGE")) return prev;
      return [
        ...prev,
        {
          itemId,
          type: "MESSAGE",
          role,
          title: text,
          expanded: false,
          timestamp: newTimestampPretty(),
          createdAtMs: Date.now(),
          status: "IN_PROGRESS",
          isHidden,
        },
      ];
    });
  };

  const updateTranscriptMessage: TranscriptContextValue["updateTranscriptMessage"] = (
    itemId,
    newText,
    append = false
  ) => {
    setTranscriptItems((prev) => {
      

      return prev.map((item) =>
        item.itemId === itemId && item.type === "MESSAGE"
          ? {
              ...item,
              title: append ? (item.title ?? "") + newText : newText,
            }
          : item
      );
    });
  };
  

  const loggedItemIds = useRef<Set<string>>(new Set());

  const updateTranscriptItemStatus: TranscriptContextValue["updateTranscriptItemStatus"] = (
    itemId,
    newStatus
  ) => {
    setTranscriptItems((prev) => {
      let shouldLog = false;
  
      const updated = prev.map((item) => {
        if (item.itemId === itemId && newStatus === "DONE" && item.status !== "DONE") {
          if (item.role === "assistant" && !loggedItemIds.current.has(itemId)) {
            shouldLog = true;
            loggedItemIds.current.add(itemId);
          }
          return { ...item, status: newStatus };
        }
        return item;
      });
  
      if (shouldLog) {
        const assistantMessages = updated.filter(
          (item) => item.type === "MESSAGE" && item.role === "assistant" && !item.isHidden
        );
  
        const lastAssistant = assistantMessages[assistantMessages.length - 1];
        const messageOnly = lastAssistant?.title?.replace(/^assistant:\s*/i, "").trim() || "";
  
        finalTranscriptSnapshot = messageOnly;
        fullTranscriptRef.current = messageOnly;
  
        console.log(" Final Assistant Message:", messageOnly);
  
        
        if (window?.sessionIdGlobal && messageOnly) {
          fetch("https://neat-funny-coyote.ngrok-free.app/human", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: messageOnly,
              type: "echo",
              interrupt: true,
              sessionid: window.sessionIdGlobal,
            }),
          }).catch((err) => console.error(" Failed to call /human:", err));
        }
  
        
        const lowerMessage = messageOnly.toLowerCase();
        if (
          lowerMessage.includes("this concludes our interview") ||
          lowerMessage.includes("interview session has been ended") ||
          lowerMessage.includes("thank you for your time") ||
          lowerMessage.includes("feel free to reach out. Have a great day!") 
        ) {
          
          (window as any).shouldStopUploading = true; 

           fetch("/api/store_transcript", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcriptItems:updated}),
          })
            .then((res) => res.json())
            .then((result) => {
            })
            .catch((err) => {
              console.error(" Error saving transcript:", err);
              
            });
  

          const match = updated[0]?.title?.match(/session\.id:\s(\S+)/);
          const openaiId = match?.[1];

          if (openaiId) {
            const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0OTAwMTEzOTM0LCJpYXQiOjE3NDY1MTM5MzQsImp0aSI6IjYwY2JiM2Y3ODdmZjQ3ZTJiZmVlNjMwNzQyNTNjZmYxIiwidXNlcl9pZCI6Mn0.STMAcG0Z3o4fpTXucNfnsPO9iQgmyqkNGqUs8gRE9HU"; 
            
            console.log("Sending session to Flask:", openaiId);
            fetch("https://warm-cute-honeybee.ngrok-free.app/api/merge_videos/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ session_id: openaiId }),
            })
              .then((res) => {
                if (!res.ok) {
                  throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
              })
              .then((data) => {
                console.log("merge_videos response:", data);
              })
              .catch((err) => {
                console.error("Error sending session to Flask:", err);
              });
          } else {
            console.warn("openaiId not found, skipping merge API call");
          }
          
                         
          
            window.dispatchEvent(
              new CustomEvent("interviewConcluded", {
                detail: {
                  summary: messageOnly,
                  closing_statement: messageOnly,
                },
              })
            );
            
            setTimeout(() => {
              if (typeof window !== "undefined") {
                window.location.href = "/feedback";
              }
            }, 100);
        }
      }
  
      return updated;
    });
  };
  

  
  const addTranscriptBreadcrumb = (title: string, data?: Record<string, any>) => {
    setTranscriptItems((prev) => [
      ...prev,
      {
        itemId: `breadcrumb-${uuidv4()}`,
        type: "BREADCRUMB",
        title,
        data,
        expanded: false,
        timestamp: newTimestampPretty(),
        createdAtMs: Date.now(),
        status: "DONE",
        isHidden: false,
      },
    ]);
  };

  const toggleTranscriptItemExpand = (itemId: string) => {
    setTranscriptItems((prev) =>
      prev.map((log) =>
        log.itemId === itemId ? { ...log, expanded: !log.expanded } : log
      )
    );
  };

  return (
    <TranscriptContext.Provider
      value={{
        transcriptItems,
        addTranscriptMessage,
        updateTranscriptMessage,
        addTranscriptBreadcrumb,
        toggleTranscriptItemExpand,
        updateTranscriptItemStatus,
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
};

export function useTranscript() {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error("useTranscript must be used within a TranscriptProvider");
  }
  return context;
}
  export const getGlobalSessionId = () => {
    return typeof window !== "undefined" ? window.sessionIdGlobal : undefined;
  };
