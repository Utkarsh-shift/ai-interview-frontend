// app/InterviewPageClient.tsx
"use client";

import App from "./App";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { TranscriptProvider } from "./contexts/TranscriptContext";
import { EventProvider } from "./contexts/EventContext";

export default function InterviewPageClient() {
  const searchParams = useSearchParams();
  const batchIdFromUrl = searchParams.get("batch_id");
  const jobIdFromUrl = searchParams.get("job_id");

  const [batchId] = useState<string | null>(batchIdFromUrl);
  const [jobId] = useState<string | null>(jobIdFromUrl);
  const [isValidBatchId, setIsValidBatchId] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setErrorMessage] = useState<string>("");
  const [token, setToken] = useState("");

  
useEffect(() => {
            const localToken = localStorage.getItem("authToken");
            const fallbackToken = process.env.NEXT_PUBLIC_TOKEN;

            const finalToken = localToken || fallbackToken || "";
            setToken(finalToken);
        }, []);


 useEffect(() => {
            if (token) {
            console.log("Token available:", token);
            }
        }, [token]);



  useEffect(() => {
    if (!batchId) return;

    const checkBatchId = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_NGROK_URL}/api/check-batch-id/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
          // "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ batch_id: batchId }),
      });


        const data = await response.json();

        if (response.ok && data.status === "success" && data.message.includes("exists")) {
          setIsValidBatchId(true);
        } else {
          setIsValidBatchId(false);
          setErrorMessage(data.message || "Batch ID does not exist.");
        }
      } catch (error) {
        console.error("Error checking batch ID:", error);
        setIsValidBatchId(false);
        setErrorMessage("Error verifying batch ID.");
      } finally {
        setLoading(false);
      }
    };

    checkBatchId();
  }, [batchId]);

  if (loading) return <div>Loading...</div>;
  if (!batchId || !jobId || isValidBatchId === false) return <div>Invalid interview link or batch ID not found in the data table.</div>;

  return (
    <TranscriptProvider>
      <EventProvider>
        <App batch_id={batchId} job_id={jobId} />
      </EventProvider>
    </TranscriptProvider>
  );
}
