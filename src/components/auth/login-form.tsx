"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/games",
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data) {
        router.push("/games");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full p-2 rounded bg-black border border-gray-700 focus:border-gold outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="block mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full p-2 rounded bg-black border border-gray-700 focus:border-gold outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-black py-2 rounded font-bold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}
