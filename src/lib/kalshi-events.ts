/**
 * Display order for game view: 1 = Best Picture, 2 = Best Actor, … 24 = Documentary Short.
 * Use getCategoryIndex(name) for "N. Category Name" display.
 */
export const CATEGORY_ORDER: string[] = [
  "Best Picture",
  "Best Actor",
  "Best Actress",
  "Best Supporting Actor",
  "Best Supporting Actress",
  "Best Director",
  "Best Cinematography",
  "Best Film Editing",
  "Best Visual Effects",
  "Best Sound",
  "Best Production Design",
  "Best Costume Design",
  "Best Makeup and Hairstyling",
  "Best Casting",
  "Best Original Screenplay",
  "Best Adapted Screenplay",
  "Best Original Score",
  "Best Original Song",
  "Best International Feature Film",
  "Best Documentary Feature Film",
  "Best Animated Feature Film",
  "Best Animated Short Film",
  "Best Live Action Short Film",
  "Best Documentary Short Film",
];

export function getCategoryIndex(categoryName: string): number {
  const i = CATEGORY_ORDER.indexOf(categoryName);
  return i === -1 ? 0 : i + 1;
}

/**
 * Ordered mapping of Oscar category display names → Kalshi event tickers.
 * Order: Picture → Acting → Director → craft awards → features → short films.
 * All 24 categories for the 98th Academy Awards.
 */
export const KALSHI_EVENTS: Record<string, string> = {
  // Big awards
  "Best Picture": "KXOSCARPIC-26",
  "Best Actor": "KXOSCARACTO-26",
  "Best Actress": "KXOSCARACTR-26",
  "Best Supporting Actor": "KXOSCARSUPACTO-26",
  "Best Supporting Actress": "KXOSCARSUPACTR-26",
  "Best Director": "KXOSCARDIR-26",

  // Screenplay
  "Best Original Screenplay": "KXOSCARSPLAY-26",
  "Best Adapted Screenplay": "KXOSCARASPLAY-26",

  // Music
  "Best Original Score": "KXOSCARSCORE-26",
  "Best Original Song": "KXOSCARSONG-26",

  // Technical craft
  "Best Cinematography": "KXOSCARCINE-26",
  "Best Film Editing": "KXOSCAREDIT-26",
  "Best Visual Effects": "KXOSCARVIS-26",
  "Best Sound": "KXOSCARSOUND-26",
  "Best Production Design": "KXOSCARPROD-26",
  "Best Costume Design": "KXOSCARCOSTUME-26",
  "Best Makeup and Hairstyling": "KXOSCARMAH-26",
  "Best Casting": "KXOSCARCASTING-26",

  // Feature films
  "Best International Feature Film": "KXOSCARINTLFILM-26",
  "Best Documentary Feature Film": "KXOSCARDOCU-26",
  "Best Animated Feature Film": "KXOSCARANIMATED-26B",

  // Short films (last)
  "Best Animated Short Film": "KXOSCARAS-26B",
  "Best Live Action Short Film": "KXOSCARLASF-26",
  "Best Documentary Short Film": "KXOSCARDSFILM-26",
};

/**
 * Static nominees for categories Kalshi has no active markets for.
 * Add entries here if a category ticker returns no active markets.
 */
export const STATIC_CATEGORIES: Array<{
  category: string;
  nominees: Array<{ name: string; kalshiTicker: string; odds: number; imageUrl: null }>;
}> = [];

// Actor categories where the nominee IS a person (not a film title)
export const ACTOR_CATEGORIES = new Set([
  "Best Actor",
  "Best Actress",
  "Best Supporting Actor",
  "Best Supporting Actress",
]);
