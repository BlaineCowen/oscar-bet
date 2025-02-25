import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getNomineeName } from "./game-utils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts text to a slug-friendly format
 */
export function slugify(text: string): string {
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

/**
 * Generate a predictable image filename for a nominee based on category and nominee name
 */
export function getNomineeImageFilename(
  category: string,
  nominee: any
): string {
  // Use the getNomineeName function to get the name properly
  const name = typeof nominee === "string" ? nominee : getNomineeName(nominee);

  // Simple slug generation, remove special characters and convert to lowercase
  const categorySlug = slugify(category);
  const nomineeSlug = slugify(name);

  // Format consistent with the upload script - no subfolder structure
  return `${categorySlug}-${nomineeSlug}.jpg`;
}

/**
 * Get the full URL for a nominee's image based on category and nominee name
 */
export function getNomineeImageUrl(category: string, nominee: any): string {
  // Generate the key to look up in the mapping
  const name = typeof nominee === "string" ? nominee : getNomineeName(nominee);
  const key = getNomineeImageFilename(category, name);

  try {
    const imageUrls = require("./nominee-image-urls.json");
    if (imageUrls.images && imageUrls.images[key]) {
      return imageUrls.images[key];
    }
    console.warn(`No URL found for ${key} in mapping`);
  } catch (e) {
    console.warn("Failed to load nominee image URLs mapping", e);
  }

  // Return empty string if image not found (Next.js Image component will handle this gracefully)
  return "";
}
