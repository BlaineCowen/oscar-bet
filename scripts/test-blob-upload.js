#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { put } = require("@vercel/blob");

// This script tests a single image upload to Vercel Blob
// to verify that your BLOB_READ_WRITE_TOKEN is working correctly

async function downloadTestImage() {
  // Create a temp directory
  const tempDir = path.join(process.cwd(), "temp_test");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const imageUrl =
    "https://www.goldderby.com/wp-content/uploads/2024/06/Anora.jpg";
  const outputPath = path.join(tempDir, "test-image.jpg");

  console.log(`Downloading test image from ${imageUrl}`);

  try {
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log("Test image downloaded successfully");
    return outputPath;
  } catch (error) {
    console.error("Error downloading test image:", error.message);
    throw error;
  }
}

async function testBlobUpload() {
  console.log("Testing Vercel Blob upload...");
  console.log(
    "BLOB_READ_WRITE_TOKEN exists:",
    !!process.env.BLOB_READ_WRITE_TOKEN
  );

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("ERROR: BLOB_READ_WRITE_TOKEN is not set!");
    console.log("Please set BLOB_READ_WRITE_TOKEN in your .env.local file");
    return;
  }

  let tempFilePath = null;

  try {
    tempFilePath = await downloadTestImage();

    console.log("Uploading test image to Vercel Blob...");
    const blob = await put(
      "test-upload.jpg",
      fs.createReadStream(tempFilePath),
      {
        access: "public",
      }
    );

    console.log("✅ Upload successful!");
    console.log("Blob URL:", blob.url);
    console.log("Vercel Blob is working correctly");

    // Write the result to a file
    fs.writeFileSync(
      path.join(process.cwd(), "test-upload-result.json"),
      JSON.stringify(
        {
          success: true,
          url: blob.url,
          baseUrl: new URL(blob.url).origin,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("❌ Error during test upload:", error);

    fs.writeFileSync(
      path.join(process.cwd(), "test-upload-result.json"),
      JSON.stringify(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } finally {
    // Clean up
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    const tempDir = path.join(process.cwd(), "temp_test");
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

testBlobUpload();
