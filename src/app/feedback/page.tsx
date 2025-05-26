
import { Suspense } from "react";
import FeedbackPage from "./feedbackpage"; 

export default function FeedbackWrapper() {
  return (
    <Suspense fallback={<div>Loading feedback page...</div>}>
      <FeedbackPage />
    </Suspense>
  );
}
