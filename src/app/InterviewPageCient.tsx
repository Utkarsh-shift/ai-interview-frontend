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
  const [loading, setLoading] = useState<boolean>(true);
  const [, setErrorMessage] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // 👇 New loader state
  const [showLoader, setShowLoader] = useState(true);

  // 👇 Loader timer effect
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // 👇 Store values from URL into localStorage
  useEffect(() => {
    if (batchIdFromUrl) localStorage.setItem("batch_id", batchIdFromUrl);
    if (jobIdFromUrl) localStorage.setItem("job_id", jobIdFromUrl);
    if (redirectUrl) localStorage.setItem("redirect_url", redirectUrl);
  }, [batchIdFromUrl, jobIdFromUrl, redirectUrl]);

  // 👇 Fetch token
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

  // 👇 Verify batch ID
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

  // 👇 Show loader first
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

  if (loading) return <div>Loading...</div>;

  // 👇 Invalid link condition
  if (!batchId || !jobId || isValidBatchId === false)
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f0f4f8, #dfe9f3)",
        fontFamily: "Segoe UI, sans-serif",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          fontSize: "72px",
          fontWeight: "bold",
          color: "#ff6b6b",
          marginBottom: "10px",
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize: "2.5rem",
          color: "#2f3542",
          marginBottom: "10px",
        }}
      >
        Invalid Interview Link
      </h1>
      <p
        style={{
          fontSize: "1.2rem",
          color: "#57606f",
          maxWidth: "600px",
          marginBottom: "30px",
        }}
      >
        The interview link you followed is invalid, or the <strong>Batch ID</strong> / <strong>Job ID</strong> does not exist in our system. Please check the URL or contact support.
      </p>
      <button
        onClick={() => window.location.href = redirectUrl || "/"}
        style={{
          padding: "12px 24px",
          backgroundColor: "#2ed573",
          color: "#fff",
          fontSize: "1rem",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          transition: "background 0.3s ease",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#28c76f")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2ed573")}
      >
        Return to Homepage
      </button>
    </div>
  );


  return (
    <TranscriptProvider>
      <EventProvider>
        <App batch_id={batchId} job_id={jobId} />
      </EventProvider>
    </TranscriptProvider>
  );
}
