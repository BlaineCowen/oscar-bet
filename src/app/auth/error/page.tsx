"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  console.log("Auth error:", {
    error,
    params: Object.fromEntries(searchParams.entries()),
  });

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-red-600">
            Authentication Error
          </h1>
          <p className="text-sm text-muted-foreground">
            {error || "An error occurred during authentication"}
          </p>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-gold px-4 py-2 text-center text-black hover:bg-gold/80"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
