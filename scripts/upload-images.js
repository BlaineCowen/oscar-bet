#!/usr/bin/env node

const { put } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Load the oscars_predictions.json data
const oscarData = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "src/lib/oscars_predictions.json"),
    "utf8"
  )
);

// Helper function to create a slug from text (keep in sync with utils.ts)
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

// Generate a predictable filename for a nominee based on category and name
function generateFilename(categoryName, nomineeName) {
  const categorySlug = slugify(categoryName);
  const nomineeSlug = slugify(nomineeName);
  return `${categorySlug}-${nomineeSlug}.jpg`;
}

async function downloadImage(url, outputPath) {
  try {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
    throw error;
  }
}

async function processCategories() {
  console.log(
    "BLOB_READ_WRITE_TOKEN exists:",
    !!process.env.BLOB_READ_WRITE_TOKEN
  );
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "ERROR: BLOB_READ_WRITE_TOKEN is not set in environment variables"
    );
    console.log("Please add BLOB_READ_WRITE_TOKEN to your .env.local file");
    return;
  }

  // Create a temp directory for downloading images
  const tempDir = path.join(process.cwd(), "temp_images");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Track all processed images
  const processedImages = [];

  try {
    console.log("Starting image processing...");

    for (const category of oscarData) {
      const categoryName = category.category;
      console.log(`Processing category: ${categoryName}`);

      for (const prediction of category.predictions) {
        let nomineeName;

        // Handle actor categories that have actor and movie fields
        if (prediction.actor) {
          nomineeName = prediction.actor;
        } else {
          nomineeName = prediction.name;
        }

        if (!nomineeName) {
          console.log("Nominee name not found, skipping.");
          continue;
        }

        if (!prediction.image) {
          console.log(`No image URL for nominee "${nomineeName}", skipping.`);
          continue;
        }

        try {
          // Generate a predictable filename based on category and nominee name
          const filename = generateFilename(categoryName, nomineeName);

          // Download the image to a temporary file
          const tempFilePath = path.join(tempDir, filename);
          console.log(
            `Downloading image for ${nomineeName} from ${prediction.image}`
          );
          await downloadImage(prediction.image, tempFilePath);

          // Upload to Vercel Blob with the predictable filename
          console.log(
            `Uploading image for ${nomineeName} to Vercel Blob as nominees/${filename}`
          );
          const blob = await put(
            `nominees/${filename}`,
            fs.createReadStream(tempFilePath),
            { access: "public" }
          );

          console.log(`Successfully uploaded to ${blob.url}`);
          processedImages.push({
            category: categoryName,
            nominee: nomineeName,
            filename,
            url: blob.url,
          });

          // Remove the temporary file
          fs.unlinkSync(tempFilePath);
        } catch (error) {
          console.error(`Error processing ${nomineeName}:`, error);
        }
      }
    }

    console.log("All images processed successfully!");

    // Write summary of processed images to a log file
    const summaryPath = path.join(process.cwd(), "upload-images-summary.json");
    fs.writeFileSync(
      summaryPath,
      JSON.stringify(
        {
          processed: processedImages,
          timestamp: new Date().toISOString(),
          baseUrl:
            processedImages.length > 0
              ? new URL(processedImages[0].url).origin
              : null,
        },
        null,
        2
      )
    );
    console.log(`Image processing summary written to ${summaryPath}`);
  } catch (error) {
    console.error("Error during processing:", error);
  } finally {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

processCategories();
