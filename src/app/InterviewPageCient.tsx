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
  const redirectUrl = searchParams.get("redirect-url");
  console.log("***********Redirect URL:***********", redirectUrl);



  const [batchId] = useState<string | null>(batchIdFromUrl);
  const [jobId] = useState<string | null>(jobIdFromUrl);
  const [isValidBatchId, setIsValidBatchId] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setErrorMessage] = useState<string>("");
  const [token, setToken] = useState<string>("");


  useEffect(() => {
    if (batchIdFromUrl) localStorage.setItem("batch_id", batchIdFromUrl);
    if (jobIdFromUrl) localStorage.setItem("job_id", jobIdFromUrl);
    if (redirectUrl) localStorage.setItem("redirect_url", redirectUrl);


    console.log("Values stored in localStorage:");
    console.log("batch_id:", batchIdFromUrl);
    console.log("job_id:", jobIdFromUrl);
    console.log("redirect_url:", redirectUrl);
  
  }, [batchIdFromUrl, jobIdFromUrl, redirectUrl]);





  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = localStorage.getItem("authToken");

      if (storedToken) {
        setToken(storedToken);
        return;
      }

      try {
      
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_NGROK_URL}/api/access_token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: process.env.NEXT_PUBLIC_USERNAME,
            password: process.env.NEXT_PUBLIC_PASSWORD,
          }),
        });

       
        const data = await response.json();

        if (response.ok && data.access) {
          localStorage.setItem("authToken", data.access);
          setToken(data.access);
        } else {
          console.error("Token fetch failed:", data);
        }
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    };

    fetchToken();
  }, []);

  
  useEffect(() => {
    if (token) {
      console.log("Access token ready:", token);
    }
  }, [token]);

  
  useEffect(() => {
    if (!batchId || !token) return;

    const checkBatchId = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_NGROK_URL}/api/check-batch-id/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
  }, [batchId, token]);


  if (loading) return <div>Loading...</div>;
  if (!batchId || !jobId || isValidBatchId === false) return <div>Invalid interview link or batch ID not found in the data table.</div>;

  return (
    <TranscriptProvider>
      <EventProvider>
        <App batch_id={batchId} job_id={jobId}  />
      </EventProvider>
    </TranscriptProvider>
  );
}
