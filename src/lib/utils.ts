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
  const cleanCategory = category
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-");
  const cleanName = name
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-");

  return `nominees/${cleanCategory}/${cleanName}.jpg`;
}

/**
 * Get the full URL for a nominee's image based on category and nominee name
 */
export function getNomineeImageUrl(category: string, nominee: any): string {
  const blobBaseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL;

  if (!blobBaseUrl) {
    console.warn("NEXT_PUBLIC_BLOB_BASE_URL is not set");
    return "";
  }

  return `${blobBaseUrl}/${getNomineeImageFilename(category, nominee)}`;
}
