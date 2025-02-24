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

export type GameWithRelations = Game & {
  categories: CategoryWithNominees[];
  participants: (GameParticipant & {
    user: User;
    bets: (Bet & {
      nominee: Nominee & {
        category: Category;
      };
    })[];
  })[];
  admin: User;
};
