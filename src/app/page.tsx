import { Suspense } from "react";
import YourComponent from "./InterviewPageCient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <YourComponent />
    </Suspense>
  );
}
