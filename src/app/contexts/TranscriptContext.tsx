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
import { TranscriptItem } from "../types";

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
  addTranscriptMessage: (
    itemId: string,
    role: "user" | "assistant",
    text: string,
    hidden?: boolean
  ) => void;
  updateTranscriptMessage: (
    itemId: string,
    text: string,
    isDelta: boolean
  ) => void;
  addTranscriptBreadcrumb: (
    title: string,
    data?: Record<string, any>
  ) => void;
  toggleTranscriptItemExpand: (itemId: string) => void;
  updateTranscriptItemStatus: (
    itemId: string,
    newStatus: "IN_PROGRESS" | "DONE"
  ) => void;
  updateTranscriptTimestamps: (
    itemId: string,
    startTime: number,
    endTime: number
  ) => void;
};

let finalTranscriptSnapshot = "";

export const getFinalTranscript = () => finalTranscriptSnapshot;

const TranscriptContext = createContext<TranscriptContextValue | undefined>(
  undefined
);

export const TranscriptProvider: FC<PropsWithChildren> = ({ children }) => {
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const fullTranscriptRef = useRef<string>("");

  const newTimestampPretty = (): string =>
    new Date().toLocaleTimeString([], {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });

  const addTranscriptMessage = (
    itemId: string,
    role: "user" | "assistant",
    text: string = "",
    isHidden: boolean = false
  ) => {
    setTranscriptItems((prev) => {
      if (
        prev.some((log) => log.itemId === itemId && log.type === "MESSAGE")
      )
        return prev;
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
          answerStartTime: Date.now(),
          answerEndTime : Date.now() ,
        },
      ];
    });
  };

const updateTranscriptTimestamps = (
  itemId: string,
  startTime: number,
  endTime: number
) => {
  setTranscriptItems((prev) =>
    prev.map((item) =>
      item.itemId === itemId
        ? { ...item, answerStartTime: startTime, answerEndTime: endTime }
        : item
    )
  );
};

  const updateTranscriptMessage = (
    itemId: string,
    newText: string,
    append: boolean = false
  ) => {
    setTranscriptItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId && item.type === "MESSAGE"
          ? {
              ...item,
              title: append ? (item.title ?? "") + newText : newText,
            }
          : item
      )
    );
  };

  const loggedItemIds = useRef<Set<string>>(new Set());

const updateTranscriptItemStatus = (
  itemId: string,
  newStatus: "IN_PROGRESS" | "DONE"
) => {
  setTranscriptItems((prev) => {
    let shouldLog = false;

    const updated = prev.map((item) => {
      if (
        item.itemId === itemId &&
        newStatus === "DONE" &&
        item.status !== "DONE"
      ) {
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
        (item) =>
          item.type === "MESSAGE" &&
          item.role === "assistant" &&
          !item.isHidden
      );

      const lastAssistant =
        assistantMessages[assistantMessages.length - 1];
      const messageOnly =
        lastAssistant?.title?.replace(/^assistant:\s*/i, "").trim() || "";

      finalTranscriptSnapshot = messageOnly;
      fullTranscriptRef.current = messageOnly;

      console.log(" Final Assistant Message:", messageOnly);

      const lowerMessage = messageOnly.toLowerCase();
      const shouldTriggerExit =
        lowerMessage.includes("this concludes our interview") ||
        lowerMessage.includes("interview session has been ended") ||
        lowerMessage.includes("thank you for your time") ||
        lowerMessage.includes("feel free to reach out. have a great day!");

      if (shouldTriggerExit) {
        (window as any).shouldStopUploading = true;

        const saveTranscriptAndExit = async () => {
          
          
          
         try {
            console.log("Saving transcript items:", updated);

            const validUserMessages = updated.filter(
              (item) =>
                item.type === "MESSAGE" &&
                item.role === "user" &&
                item.title?.trim() &&
                typeof item.answerStartTime === "number" &&
                typeof item.answerEndTime === "number"
            );

            const res = await fetch("/api/store_transcript", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcriptItems: validUserMessages }),
           });




            if (!res.ok) {
              const text = await res.text();
              console.error(" Failed to store transcript:", text);
            } else {
              console.log(" Transcript stored successfully");
            }
          } catch (err) {
            console.error("Error saving transcript:", err);
          }

          const match = updated.find((item) =>
            item.title?.includes("session.id:")
          )?.title?.match(/session\.id:\s*(\S+)/);
          const openaiId = match?.[1];

          if (openaiId) {

          try {
            await fetch("/api/Lipsync_session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                openai_session_id: openaiId,
                ended_at: new Date().toISOString(),
              }),
            });
            console.log("✅ ended_at updated for", openaiId);
          } catch (err) {
            console.error("❌ Error updating ended_at in lipsync session:", err);
          }

            const NGROK_URL = process.env.NEXT_PUBLIC_BACKEND_NGROK_URL;
            const token = localStorage.getItem("authToken") ;

            try {
              const res = await fetch(`${NGROK_URL}/api/merge_videos/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ session_id: openaiId }),
              });

              const data = await res.json();
              console.log("merge_videos response:", data);
            } catch (err) {
              console.error(" Error calling merge_videos:", err);
            }
          } else {
            console.warn(" openaiId not found — skipping merge call");
          }

          window.dispatchEvent(
            new CustomEvent("interviewConcluded", {
              detail: {
                summary: messageOnly,
                closing_statement: messageOnly,
              },
            })
          );

           const batchId = localStorage.getItem("batch_id");
            const jobId = localStorage.getItem("job_id");
            const redirectUrl = localStorage.getItem("redirect_url");
           

            if (batchId && jobId && redirectUrl) {
              const feedbackUrl = `/feedback?batch_id=${batchId}&job_id=${jobId}&redirect-url=${encodeURIComponent(
                redirectUrl
              )}`;

                              setTimeout(() => {
                    window.location.href = feedbackUrl;
                  }, 5000); // 
            } else {
              console.error("Missing required data for feedback redirection.");
            }


        };
        void saveTranscriptAndExit();
      }
    }

    return updated;
  });
};


  const addTranscriptBreadcrumb = (
    title: string,
    data?: Record<string, any>
  ) => {
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
        updateTranscriptTimestamps,
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

export const getGlobalSessionId = (): number | undefined => {
  return typeof window !== "undefined" ? window.sessionIdGlobal : undefined;
};
