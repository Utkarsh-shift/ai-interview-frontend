"use client";
import App from "./App";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const batchIdFromUrl = searchParams.get("batch_id");  // Get batch_id from search params
  const jobIdFromUrl = searchParams.get("job_id");  // Get job_id from search params
  
  const [batchId, setBatchId] = useState<string | null>(batchIdFromUrl); // Manage batch_id state
  const [jobId, setJobId] = useState<string | null>(jobIdFromUrl); // Manage job_id state
  const [isValidBatchId, setIsValidBatchId] = useState<boolean | null>(null); // Store batch_id validity status
  const [loading, setLoading] = useState<boolean>(true); // Show loading state while waiting for API response
  const [errorMessage, setErrorMessage] = useState<string>(''); // Store error message in case of failure

  useEffect(() => {
    if (!batchId) return;

    const checkBatchId = async () => {
      setLoading(true);
      setErrorMessage(''); // Reset error message

      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0OTAwMTEzOTM0LCJpYXQiOjE3NDY1MTM5MzQsImp0aSI6IjYwY2JiM2Y3ODdmZjQ3ZTJiZmVlNjMwNzQyNTNjZmYxIiwidXNlcl9pZCI6Mn0.STMAcG0Z3o4fpTXucNfnsPO9iQgmyqkNGqUs8gRE9HU"; 
            
      try {
        const response = await fetch("https://warm-cute-honeybee.ngrok-free.app/api/check-batch-id/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ batch_id: batchId }), // Sending batch_id in request body
        });

        const data = await response.json();

        if (response.ok) {
          console.log('API call successful, response status is OK');
          console.log('Response data:', data);

          if (data.status === 'success' && data.message.includes('exists')) {
            console.log('Batch ID exists in the database.');
            setIsValidBatchId(true); // Batch ID exists
          } else {
            console.log('Batch ID does not exist or another error occurred.');
            setIsValidBatchId(false); // Batch ID does not exist
          }
        } else {
          console.log('API call failed with status:', response.status);
          console.log('Error message:', data.message || 'An error occurred while checking batch ID.');
          
          setErrorMessage(data.message || 'An error occurred while checking batch ID.');
          setIsValidBatchId(false); // Mark as invalid if there's an error
        }
      } catch (error) {
        console.error('Error checking batch ID:', error);
        
        setErrorMessage('Failed to check batch ID. Please try again later.');
        setIsValidBatchId(false); // Mark as invalid if error occurs
      } finally {
        console.log('Loading finished.');
        setLoading(false);
      }
    };

    checkBatchId();
  }, [batchId]); // This hook runs whenever batchId changes

  if (loading) {
    return <div>Loading...</div>; // Show loading state
  }

  // If batchId or jobId is missing, or batchId is invalid, show the invalid URL message
  if (!batchId || !jobId || isValidBatchId === null || !isValidBatchId) {
    return <div>Invalid interview link or batch ID not found in the data table.</div>;
  }

  // Return the interview component only if the batch ID is valid
  return (
    <TranscriptProvider>
      <EventProvider>
        <App batch_id={batchId} job_id={jobId} />
      </EventProvider>
    </TranscriptProvider>
  );
}
