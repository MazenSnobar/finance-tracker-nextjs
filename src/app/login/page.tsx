"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", {
      ...formData,
      redirect: false,
    });

    if (!res?.error) {
      router.push("/transactions");
    } else {
      alert("Invalid login credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-150">
        <h2 className="text-black text-2xl font-bold mb-4">Login</h2>
        <input  
          type="email"
          placeholder="Email"
          required
          className="text-black w-full p-2 border mb-3 rounded"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          required
          className="text-black w-full p-2 border mb-3 rounded"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
}
