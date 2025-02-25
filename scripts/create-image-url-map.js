#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

async function createImageUrlMap() {
  try {
    console.log("Reading the upload images summary file...");

    const summaryPath = path.join(process.cwd(), "upload-images-summary.json");

    if (!fs.existsSync(summaryPath)) {
      console.log(
        "Summary file not found. Please run the upload-images.js script first."
      );
      return;
    }

    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));

    // Check if there are any processed images
    if (!summary.processed || summary.processed.length === 0) {
      console.log("No processed images found in the summary file.");
      return;
    }

    // Create a map of predictable filenames to actual URLs with hashes
    const imageUrlMap = {};

    for (const item of summary.processed) {
      const category = item.category;
      const nominee = item.nominee;
      const url = item.url;

      // Create a consistent key using category and nominee names
      const categorySlug = slugify(category);
      const nomineeSlug = slugify(nominee);
      const key = `${categorySlug}-${nomineeSlug}.jpg`;

      imageUrlMap[key] = url;
    }

    // Get base URL for reference
    const baseUrl =
      summary.baseUrl ||
      summary.processed[0].url.match(
        /(https:\/\/.*?\.public\.blob\.vercel-storage\.com)/
      )[1];

    // Create the final output object
    const output = {
      baseUrl,
      images: imageUrlMap,
    };

    // Save as JSON
    const outputPath = path.join(
      process.cwd(),
      "src/lib/nominee-image-urls.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(
      `Created mapping file with ${Object.keys(imageUrlMap).length} image URLs`
    );
    console.log(`File saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Helper function to slugify text (same as in utils.ts)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+/, "") // Trim hyphens from start
    .replace(/-+$/, ""); // Trim hyphens from end
}

createImageUrlMap();
