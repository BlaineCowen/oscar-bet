import { JSDOM } from "jsdom";
import axios from "axios";

interface ScrapedNominee {
  category: string;
  name: string;
  odds: string;
}

export async function getUpdatedNominees(): Promise<ScrapedNominee[]> {
  try {
    const { data } = await axios.get(
      "https://www.goldderby.com/odds/combined-odds/oscars-2025-predictions/",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    const dom = new JSDOM(data);
    const document = dom.window.document;
    const scrapedNominees: ScrapedNominee[] = [];

    document
      .querySelectorAll(".predictions-wrapper")
      .forEach((category: Element) => {
        const categoryTitle = category
          .querySelector(".category-title")
          ?.textContent?.trim()
          .replace(/\t/g, "")
          .replace(/\n/g, " ")
          .replace(/\s*\(more info\)/i, "")
          .replace(/\s+/g, " ");

        if (!categoryTitle) return;

        category
          .querySelectorAll(".predictions-list li")
          .forEach((item: Element) => {
            const name = item
              .querySelector(".predictions-name")
              ?.textContent?.trim()
              .replace(/\s+/g, " ");
            const oddsElements = item.querySelectorAll(
              ".predictions-odds.predictions-experts.gray"
            );
            const odds = oddsElements[2]?.textContent?.trim();

            const isActorCategory = [
              "Best Actor",
              "Best Actress",
              "Best Supporting Actor",
              "Best Supporting Actress",
              "Best Song",
            ].includes(categoryTitle);

            if (name && odds) {
              if (isActorCategory && name.includes(" ")) {
                const [actor, ...movieParts] = name.split(" ");
                const movie = movieParts.join(" ");
                scrapedNominees.push({
                  category: categoryTitle,
                  name: actor,
                  odds,
                });
              } else {
                scrapedNominees.push({
                  category: categoryTitle,
                  name,
                  odds,
                });
              }
            }
          });
      });

    console.log(
      "Scraped categories:",
      new Set(scrapedNominees.map((n) => n.category))
    );

    return scrapedNominees;
  } catch (error) {
    console.error("Failed to scrape odds:", error);
    return [];
  }
}
