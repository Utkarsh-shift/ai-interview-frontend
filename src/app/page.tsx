// import { Suspense } from "react";
// import YourComponent from "./InterviewPageCient";

// export default function Page() {
//   return (
//     <Suspense fallback={<div>Loading...</div>}>
//       <YourComponent />
//     </Suspense>
//   );
// }


"use client";
 
import React from "react";
import App from "./App";
import { TranscriptProvider } from "../app/contexts/TranscriptContext";
import { EventProvider } from "../app/contexts/EventContext";
 
export default function InterviewPage() {
  const batchId: string = "213324dwfdwsdf";
  const jobId: string = "wfwefvwe";
 
  return (
    <TranscriptProvider>
      <EventProvider>
        <App batch_id={batchId} job_id={jobId} />
      </EventProvider>
    </TranscriptProvider>
  );
}