"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("sessionId");
    if (id) setSessionId(id);
  }, []);

  const handleSubmit = async () => {
    if (!sessionId || !feedback || !rating) {
      console.log("Please complete all fields before submitting.");
      return;
    }

    const res = await fetch("/api/save_feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openai_session_id: sessionId,
        feedback,
        rating,
      }),
    });

    if (res.ok) {
      window.close(); 
      setTimeout(() => router.push("/")); 
    } else {
      const error = await res.json();
      console.error("Submission failed:", error);
    }
  };

  const handleSkip = () => {
    window.close(); 
    setTimeout(() => router.push("/"), 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white px-4">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">
        Thank you for completing the interview!
      </h1>
      <p className="mb-2 text-gray-800">We’d love to hear your feedback:</p>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full max-w-md border border-gray-300 rounded-lg p-3 mb-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
        placeholder="Share your thoughts..."
      />
      <div className="mb-4">
        <label className="mr-2 font-semibold text-gray-800">Rate our platform:</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-2xl cursor-pointer ${
                rating >= star ? "text-yellow-400" : "text-gray-300"
              }`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col space-y-2 mt-2 w-full max-w-md">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Submit Feedback & Exit
        </button>
        <button
          onClick={handleSkip}
          className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400 transition"
        >
          Skip & Exit
        </button>
      </div>
    </div>
  );
}
