/** True American Where — brand constants + category taxonomy. */

export const brand = {
  name: "True American Where",
  slogan: "Find the Real Local Stores — Food, Hair, Tires, Markets, and More.",
  shortPitch:
    "The neighborhood directory for real local businesses — food, hair, tires, markets, and more.",
  logo: "/brand/logo.png",
  favicon: "/brand/favicon.png",
  email: "hello@trueamericanwhere.com",
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://trueamericanwhere.vercel.app";

export type Category = {
  name: string;
  slug: string;
  icon: string; // Font Awesome free-solid name
  blurb: string;
};

/** The 14 launch categories (icons are Font Awesome Free Solid). */
export const CATEGORIES: Category[] = [
  { name: "Fried Food", slug: "fried-food", icon: "drumstick-bite", blurb: "Catfish, wings & golden fried favorites" },
  { name: "Soul Food", slug: "soul-food", icon: "utensils", blurb: "Home-cooked, Sunday-supper classics" },
  { name: "Fish Markets", slug: "fish-markets", icon: "fish", blurb: "Fresh catch, seafood & fixings" },
  { name: "Grocery Markets", slug: "grocery-markets", icon: "basket-shopping", blurb: "Neighborhood groceries, produce & meat" },
  { name: "Food Trucks", slug: "food-trucks", icon: "truck", blurb: "Street eats on wheels" },
  { name: "Hair Salons", slug: "hair-salons", icon: "scissors", blurb: "Cuts, color & styling" },
  { name: "Barber Shops", slug: "barber-shops", icon: "user-tie", blurb: "Classic cuts, fades & hot-towel shaves" },
  { name: "Tire Shops", slug: "tire-shops", icon: "car", blurb: "Tires, rotations & roadside help" },
  { name: "Car Washes", slug: "car-washes", icon: "soap", blurb: "Wash, wax & detail" },
  { name: "Clothing Stores", slug: "clothing-stores", icon: "shirt", blurb: "Local apparel & streetwear" },
  { name: "Repair Shops", slug: "repair-shops", icon: "screwdriver-wrench", blurb: "Fix-it shops for auto, home & more" },
  { name: "Beauty Supply", slug: "beauty-supply", icon: "wand-magic-sparkles", blurb: "Hair, nails & beauty essentials" },
  { name: "Bakeries", slug: "bakeries", icon: "bread-slice", blurb: "Fresh bread, cakes & sweets" },
  { name: "Nightclubs", slug: "nightclubs", icon: "champagne-glasses", blurb: "Live music, dancing & late nights" },
  { name: "Local & Mom-and-Pop", slug: "local-shops", icon: "store", blurb: "The shops that make a town" },
];

export const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

/** Schema.org LocalBusiness subtype per category (for JSON-LD). */
export const SCHEMA_TYPE_BY_CATEGORY: Record<string, string> = {
  "fried-food": "Restaurant",
  "soul-food": "Restaurant",
  "fish-markets": "Store",
  "grocery-markets": "GroceryStore",
  "food-trucks": "FoodEstablishment",
  "hair-salons": "HairSalon",
  "barber-shops": "HairSalon",
  "tire-shops": "AutoRepair",
  "car-washes": "AutoWash",
  "clothing-stores": "ClothingStore",
  "repair-shops": "AutoRepair",
  "beauty-supply": "HealthAndBeautyBusiness",
  bakeries: "Bakery",
  nightclubs: "NightClub",
  "local-shops": "LocalBusiness",
};
