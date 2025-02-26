import { useSession, signIn, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import type { User as DbUser } from "@prisma/client";
import type { User } from "next-auth";
import type { Session } from "next-auth";

// Combine both user types to ensure we have all properties
export type SessionUser = User & {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export function useAuth() {
  const sessionResult = useSession();
  const { data: session } = sessionResult;

  const query = useQuery<Session | null>({
    queryKey: ["auth"],
    queryFn: async () => session,
    enabled: sessionResult.status !== "loading",
  });

  return {
    ...query,
    session,
    user: session?.user as SessionUser | undefined,
    status: sessionResult.status,
    isAuthenticated: !!session?.user,
    signIn,
    signOut,
  };
}

export function useUserId() {
  const { session, status } = useAuth();

  return useQuery({
    queryKey: ["user", "id"],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      return session.user.id;
    },
    enabled: status !== "loading",
  });
}

export function useUser() {
  const { session, status } = useAuth();

  return useQuery<SessionUser | null>({
    queryKey: ["user"],
    queryFn: async () => {
      if (!session?.user) return null;
      return session.user as SessionUser;
    },
    enabled: status !== "loading",
  });
}

export function useIsGameAdmin(gameAdminId: string | undefined) {
  const { data: userId } = useUserId();

  if (!gameAdminId || !userId) {
    return false;
  }

  return userId === gameAdminId;
}
