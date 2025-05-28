"use client";

import App from "./App";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { TranscriptProvider } from "./contexts/TranscriptContext";
import { EventProvider } from "./contexts/EventContext";
import Image from "next/image";

export default function InterviewPageClient() {
  const searchParams = useSearchParams();
  const batchIdFromUrl = searchParams.get("batch_id");
  const jobIdFromUrl = searchParams.get("job_id");
  const redirectUrl = searchParams.get("redirect-url");

  const [batchId] = useState<string | null>(batchIdFromUrl);
  const [jobId] = useState<string | null>(jobIdFromUrl);
  const [isValidBatchId, setIsValidBatchId] = useState<boolean | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"pending" | "expired" | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setErrorMessage] = useState<string>("");
  const [token, setToken] = useState<string>("");

  const [showLoader, setShowLoader] = useState(true);

  // Loader animation (first 2.5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Store URL params in localStorage
  useEffect(() => {
    if (batchIdFromUrl) localStorage.setItem("batch_id", batchIdFromUrl);
    if (jobIdFromUrl) localStorage.setItem("job_id", jobIdFromUrl);
    if (redirectUrl) localStorage.setItem("redirect_url", redirectUrl);
  }, [batchIdFromUrl, jobIdFromUrl, redirectUrl]);

  // Token fetch logic
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

  // Validate Batch ID existence
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

  // Validate interview session status
  useEffect(() => {
    if (!batchId || !token || isValidBatchId === false) return;

    const validateLink = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_NGROK_URL}/api/validate-link/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ batch_id: batchId }),
        });

        const data = await response.json();

        if (response.ok && data.status === "success" && data.message.includes("session is pending")) {
          setSessionStatus("pending");
        } else {
          setSessionStatus("expired");
          setErrorMessage(data.message || "Session has expired.");
        }
      } catch (error) {
        console.error("Error validating link:", error);
        setSessionStatus("expired");
        setErrorMessage("Error validating session link.");
      }
    };

    validateLink();
  }, [batchId, token, isValidBatchId]);

  // Loader page (first 2.5 seconds)
  if (showLoader) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center px-6 text-center">
        <Image
          src="/PLACECOM LOGO SVG.svg"
          alt="AlmaBay Logo"
          width={128}
          height={128}
          className="w-24 md:w-32 mb-6 drop-shadow-md"
        />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Setting Up Your AI Interview Platform
        </h1>
        <p className="text-gray-600 mb-6 text-sm md:text-base">
          Please hold on while we prepare your personalized experience.
        </p>
        <div className="w-48 md:w-64 h-2 bg-gray-200 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 animate-loading-bar rounded-full" />
        </div>
      </div>
    );
  }

  // Still loading or waiting for checks
  if (loading || isValidBatchId === null || sessionStatus === null) return <div>Loading...</div>;

  // Invalid link or batchId/jobId missing
  if (!batchId || !jobId || isValidBatchId === false) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-red-50 via-white to-red-100 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-2">404</h1>
        <p className="text-lg text-gray-700 mb-4">Invalid Interview Link</p>
        <p className="text-sm text-gray-500 mb-6">
          The interview link you followed is invalid, or the <strong>Batch ID</strong> / <strong>Job ID</strong> does not exist.
        </p>
        <button
          onClick={() => window.location.href = redirectUrl || "/"}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  if (sessionStatus === "expired") {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-red-50 via-white to-red-100 flex flex-col items-center justify-center px-6 text-center">
        <Image
          src="/PLACECOM LOGO SVG.svg"
          alt="AlmaBay Logo"
          width={128}
          height={128}
          className="w-24 md:w-32 mb-6 drop-shadow-md"
        />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Interview Session Expired
        </h1>
        <p className="text-gray-600 mb-6 text-sm md:text-base">
          This interview session has already been attempted or the session has expired.
        </p>
        <button
          onClick={() => window.location.href = redirectUrl || "/"}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Return to Homepage
        </button>
      </div>
    );
  }


  return (
    <TranscriptProvider>
      <EventProvider>
        <App batch_id={batchId} job_id={jobId} />
      </EventProvider>
    </TranscriptProvider>
  );
}
