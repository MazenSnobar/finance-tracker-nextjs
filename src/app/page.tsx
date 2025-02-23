"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center p-6">
      <h1 className="text-4xl font-extrabold mb-4">Start Your Saving Journey</h1>
      <p className="text-lg mb-6 max-w-md">
        Track your expenses, manage your budget, and take control of your financial future.
      </p>

      {/* Start Now Button */}
      <button
          onClick={() => router.push("/login")}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition"
        >
          Start Now
        </button>
      {/* Illustration */}
      <div className="mt-8">
        <img src="/savings.svg" alt="Saving money illustration" className="w-64 mx-auto" />
      </div>
    </div>
  );
}
