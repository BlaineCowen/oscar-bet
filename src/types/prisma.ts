import type {
  Game,
  Category,
  Nominee,
  GameParticipant,
  User,
  Bet,
} from "@prisma/client";

export type CategoryWithNominees = Category & {
  nominees: Nominee[];
  isLocked: boolean;
};

export type ParticipantWithUser = GameParticipant & {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  bets: (Bet & {
    nominee: Nominee & {
      category: Category;
    };
  })[];
};

export type GameWithRelations = Game & {
  categories: CategoryWithNominees[];
  participants: ParticipantWithUser[];
  admin: User;
};
