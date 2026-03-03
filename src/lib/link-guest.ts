import { prisma } from "@/lib/prisma";

/**
 * Links a guest GameParticipant (identified by a `pt` cookie token) to a
 * newly-registered or newly-logged-in user account.
 *
 * Returns the gameId that was linked, or null if nothing was linked.
 *
 * Rules:
 * - Only links if the participant still has userId=null (not already linked)
 * - Skips if the user already has a different participant in the same game
 *   (collision — don't merge bets/balance)
 * - Keeps participant.name as-is (their chosen game display name)
 * - Clears participant.token so the stale pt cookie stops matching
 */
export async function linkGuestParticipant(
  ptToken: string,
  userId: string
): Promise<string | null> {
  const guest = await prisma.gameParticipant.findUnique({
    where: { token: ptToken },
  });

  if (!guest) return null;
  if (guest.userId !== null) return null; // already linked

  // Collision check: user already has a participant in this game
  const collision = await prisma.gameParticipant.findFirst({
    where: { userId, gameId: guest.gameId },
  });
  if (collision) return null;

  await prisma.gameParticipant.update({
    where: { id: guest.id },
    data: {
      userId,
      token: null, // invalidate the guest token so stale pt cookie stops working
      // name kept as-is — it's their chosen game alias, not the account name
    },
  });

  return guest.gameId;
}

/** Cookie options matching how pt is originally set */
export const PT_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
