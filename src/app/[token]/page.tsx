// "use client";

// import App from "../App";
// import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
// import { EventProvider } from "@/app/contexts/EventContext";
// import { useParams, useSearchParams } from "next/navigation";


// export default function InterviewPage() {
//   const params = useParams();
//   const searchParams = useSearchParams();

  
//   const batch_id = searchParams.get("batch_id");
//   const job_Id = searchParams.get("job_id"); 
//   console.log("Batch ID:", batch_id);
//   console.log("Job ID:", job_Id);
 
//   if (!batch_id || !job_Id) {
//     return <div>Invalid interview link.</div>;
//   }
  
//   return (
//     <TranscriptProvider>
//       <EventProvider>
//         <App  batch_id={batch_id} job_id={job_Id} />
//       </EventProvider>
//     </TranscriptProvider>
//   );
// }
