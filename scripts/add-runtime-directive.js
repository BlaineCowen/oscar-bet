#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const apiRoutesDir = path.join(process.cwd(), "src", "app", "api");

async function walkDir(dir) {
  const files = await readdir(dir);
  const result = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      result.push(...(await walkDir(filePath)));
    } else if (file === "route.ts") {
      result.push(filePath);
    }
  }

  return result;
}

async function addRuntimeDirective(filePath) {
  try {
    let content = await readFile(filePath, "utf8");

    // Skip if it already has runtime directive
    if (content.includes("export const runtime")) {
      console.log(`Skipping ${filePath} - already has runtime directive`);
      return;
    }

    // Find imports section
    const importEndIndex = content.lastIndexOf("import");
    if (importEndIndex === -1) {
      console.log(`Skipping ${filePath} - couldn't identify imports section`);
      return;
    }

    // Find the end of imports section
    const importSection = content.slice(0, importEndIndex + 200);
    const importSectionLines = importSection.split("\n");
    let insertIndex = 0;

    for (let i = importSectionLines.length - 1; i >= 0; i--) {
      if (importSectionLines[i].trim().startsWith("import ")) {
        // Find the next non-empty line
        for (let j = i + 1; j < importSectionLines.length; j++) {
          if (importSectionLines[j].trim() !== "") {
            insertIndex = content.indexOf(importSectionLines[j]);
            break;
          }
        }
        if (insertIndex === 0) {
          // If we didn't find a non-empty line, insert after the last import
          insertIndex =
            content.indexOf(importSectionLines[i]) +
            importSectionLines[i].length;
        }
        break;
      }
    }

    // Insert the runtime directive after the imports
    const directive =
      '\n\n// Force Node.js runtime for Prisma and better-auth\nexport const runtime = "nodejs";\n';
    const newContent =
      content.slice(0, insertIndex) + directive + content.slice(insertIndex);

    await writeFile(filePath, newContent, "utf8");
    console.log(`Added runtime directive to ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  try {
    const routes = await walkDir(apiRoutesDir);
    console.log(`Found ${routes.length} API routes`);

    for (const route of routes) {
      await addRuntimeDirective(route);
    }

    console.log("Completed adding runtime directives!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
