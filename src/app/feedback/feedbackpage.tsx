"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Logo from "/public/PLACECOM LOGO SVG.svg"; // Corrected import path for logo

export default function FeedbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("sessionId");
    if (id) setSessionId(id);

    const rawRedirectUrl = searchParams.get("redirect-url");
    const decodedUrl = rawRedirectUrl ? decodeURIComponent(rawRedirectUrl) : null;
    setRedirectUrl(decodedUrl);
  }, []);

  const handleSubmit = async () => {
    if (!sessionId || !feedback || !rating) {
      alert("Please complete all fields before submitting.");
      return;
    }

    const res = await fetch("e_fee/api/savdback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openai_session_id: sessionId,
        feedback,
        rating,
      }),
    });

    if (res.ok) {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        window.close();
        setTimeout(() => router.push("/"), 1000);
      }
    } else {
      const error = await res.json();
      console.error("Submission failed:", error);
    }
  };

  const handleSkip = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.close();
      setTimeout(() => router.push("/"), 1000);
    }
  };

  const handleButtonAnimation = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.classList.add("animate-button-pop");
    setTimeout(() => e.currentTarget.classList.remove("animate-button-pop"), 250);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-sky-50 to-indigo-100 overflow-hidden">
      {/* Floating SVG background blob */}
      <div className="absolute w-[700px] h-[700px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse-slow top-[-200px] left-[-150px] z-0"></div>
      <div className="absolute w-[500px] h-[500px] bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse-slower bottom-[-150px] right-[-100px] z-0"></div>

      <div className="relative z-10 w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-8 fade-in transition-all duration-500 ease-in-out">
        <div className="flex flex-col items-center">
          <Image src={Logo} alt="Placecom Logo" width={70} height={70} className="mb-3 animate-bounce" />
          <h1 className="text-2xl font-extrabold mb-2 text-blue-700 text-center">
            Thank you for completing the interview!
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-400 to-violet-500 rounded-full mb-6 animate-loading-bar"></div>
          <p className="mb-4 text-gray-700 text-center">We’d love to hear your thoughts:</p>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-4 mb-6 text-gray-800 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            rows={5}
            placeholder="Share your experience..."
          />

          <div className="mb-6 text-center relative">
            <label className="mr-2 font-semibold text-gray-700">Rate us:</label>
            <div className="flex justify-center space-x-2 mt-2 relative z-10">
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={value}
                  className={`text-3xl cursor-pointer transition-all duration-200 ease-in-out ${
                    rating === value ? "scale-125" : "opacity-60"
                  } hover:scale-125`}
                  onClick={() => setRating(value)}
                >
                  {["😞", "😕", "😐", "🙂", "😄"][value - 1]}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-3 w-full sm:flex-row sm:space-y-0 sm:space-x-5 sm:justify-center mt-4">
            <button
              onClick={(e) => {
                handleButtonAnimation(e);
                handleSubmit();  // Move function calls outside of the ternary operator
              }}
              className="w-full sm:w-auto bg-[#0048B4] hover:bg-[#003b9e] text-white px-8 py-3 rounded-md font-medium tracking-wide shadow-sm hover:shadow-md transition-all duration-200"
            >
              Submit Feedback & Exit
            </button>

            <button
              onClick={(e) => {
                handleButtonAnimation(e);
                handleSkip();  // Move function calls outside of the ternary operator
              }}
              className="w-full sm:w-auto bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 px-8 py-3 rounded-md font-medium tracking-wide transition-all duration-200"
            >
              Skip & Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
