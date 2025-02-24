import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface AuthData {
  user: User;
  session: Session;
}

export function useAuth() {
  return useQuery<AuthData, Error>({
    queryKey: ["auth"],
    queryFn: async () => {
      try {
        const result = await authClient.getSession();
        if (!result?.data) {
          throw new Error("Not authenticated");
        }
        return result.data;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to get session");
      }
    },
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useUserId() {
  const { data: session, isLoading, error } = useAuth();

  if (isLoading) {
    return undefined;
  }

  if (error || !session?.user?.id) {
    return null;
  }

  return session.user.id;
}

export function useUser() {
  const { data: session, isLoading, error } = useAuth();

  if (isLoading) {
    return undefined;
  }

  if (error || !session?.user) {
    return null;
  }

  return session.user;
}

export function useIsGameAdmin(gameAdminId: string | undefined) {
  const userId = useUserId();

  if (!gameAdminId || !userId) {
    return false;
  }

  return userId === gameAdminId;
}
