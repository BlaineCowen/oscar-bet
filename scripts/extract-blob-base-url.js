#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

async function extractBlobBaseUrl() {
  try {
    console.log("Looking for the upload images summary file...");

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

    // Extract base URL from the first processed image
    const firstImageUrl = summary.processed[0].url;

    // Parse the URL to get just the base URL part (without the unique hash and filename)
    // Format: https://3isexyxg2bd3whr8.public.blob.vercel-storage.com/nominees/best-picture-anora-RHNFerpuJfYaHbG7BbSHFcWB8bkVvw.jpg
    const baseUrlMatch = firstImageUrl.match(
      /(https:\/\/.*?\.public\.blob\.vercel-storage\.com)/
    );

    if (!baseUrlMatch) {
      console.log("Could not extract base URL from image URL:", firstImageUrl);
      return;
    }

    const baseUrl = baseUrlMatch[1];
    console.log(`Found blob base URL: ${baseUrl}`);

    // Create or update .env.local file
    const envLocalPath = path.join(process.cwd(), ".env.local");
    let envContent = "";

    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, "utf8");

      // Check if NEXT_PUBLIC_BLOB_BASE_URL already exists
      const regex = /NEXT_PUBLIC_BLOB_BASE_URL=.*/;
      if (regex.test(envContent)) {
        // Replace existing variable
        envContent = envContent.replace(
          regex,
          `NEXT_PUBLIC_BLOB_BASE_URL="${baseUrl}"`
        );
      } else {
        // Add new variable
        envContent += `\nNEXT_PUBLIC_BLOB_BASE_URL="${baseUrl}"\n`;
      }
    } else {
      // Create new file
      envContent = `NEXT_PUBLIC_BLOB_BASE_URL="${baseUrl}"\n`;
    }

    fs.writeFileSync(envLocalPath, envContent);
    console.log(
      `.env.local updated with NEXT_PUBLIC_BLOB_BASE_URL="${baseUrl}"`
    );

    // Add baseUrl to summary file for reference
    summary.baseUrl = baseUrl;
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log("Updated summary file with baseUrl property");
  } catch (error) {
    console.error("Error:", error);
  }
}

extractBlobBaseUrl();
