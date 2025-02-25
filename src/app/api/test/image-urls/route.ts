import { NextResponse } from "next/server";
import { getNomineeImageUrl } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get a few categories and nominees to test
    const categories = await prisma.category.findMany({
      take: 2,
      include: {
        nominees: {
          take: 2,
        },
      },
    });

    // Test URL generation with various scenarios
    const results = categories.map((category) => {
      return {
        categoryName: category.name,
        nominees: category.nominees.map((nominee) => ({
          nomineeName: nominee.name,
          imageUrl: getNomineeImageUrl(category.name, nominee.name),
        })),
      };
    });

    // Add a specific test for Best Picture category
    const testUrl = getNomineeImageUrl("Best Picture", "Anora");

    // Log results for debugging
    console.log("Sample image URL test:", testUrl);

    return NextResponse.json({
      success: true,
      message: "Image URL test completed",
      results,
      specificTest: {
        category: "Best Picture",
        nominee: "Anora",
        imageUrl: testUrl,
      },
    });
  } catch (error) {
    console.error("Error testing image URLs:", error);
    return NextResponse.json(
      { error: "Failed to test image URLs" },
      { status: 500 }
    );
  }
}
