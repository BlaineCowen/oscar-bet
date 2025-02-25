import { NextResponse } from "next/server";
import { getNomineeImageFilename, getNomineeImageUrl } from "@/lib/utils";

export async function GET() {
  const testCases = [
    { category: "Best Picture", nominee: "Anora" },
    { category: "Best Actor", nominee: "Cillian Murphy" },
    { category: "Best Actress", nominee: "Lily Gladstone" },
    // Add more test cases as needed
  ];

  const results = testCases.map(({ category, nominee }) => {
    const filename = getNomineeImageFilename(category, nominee);
    const fullUrl = getNomineeImageUrl(category, nominee);

    return {
      category,
      nominee,
      filename,
      fullUrl,
    };
  });

  return NextResponse.json({
    results,
    blobBaseUrl: process.env.NEXT_PUBLIC_BLOB_BASE_URL || "(not set)",
  });
}
