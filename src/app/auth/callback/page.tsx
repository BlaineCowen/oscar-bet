import AuthCallback from "@/components/auth/auth-callback";

// Force dynamic rendering for auth callback page
export const dynamic = "force-dynamic";

// Force Node.js runtime for auth callback page
export const runtime = "nodejs";

export default function AuthCallbackPage() {
  return <AuthCallback />;
}
