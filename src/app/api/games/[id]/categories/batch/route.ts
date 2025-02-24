import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Category, Nominee } from "@prisma/client";

const categorySchema = z.object({
  name: z.string(),
  nominees: z.array(
    z.object({
      name: z.string(),
      odds: z.number().positive(),
    })
  ),
});

const batchSchema = z.array(categorySchema);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const result = batchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const categories = result.data;

    type TransactionResult = {
      categories: (Category & {
        nominees: Nominee[];
      })[];
    };

    const updatedCategories = await prisma.$transaction<TransactionResult>(
      async (tx) => {
        // Delete existing categories
        await tx.category.deleteMany({
          where: { gameId: id },
        });

        // Create new categories with nominees
        const createdCategories = await Promise.all(
          categories.map((category) =>
            tx.category.create({
              data: {
                name: category.name,
                gameId: id,
                nominees: {
                  create: category.nominees.map((nominee) => ({
                    name: nominee.name,
                    odds: nominee.odds,
                  })),
                },
              },
              include: {
                nominees: true,
              },
            })
          )
        );

        return { categories: createdCategories };
      }
    );

    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error("Failed to update categories:", error);
    return NextResponse.json(
      { error: "Failed to update categories" },
      { status: 500 }
    );
  }
}
