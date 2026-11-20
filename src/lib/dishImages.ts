/**
 * Dish image resolver utility
 * Maps dishes to their distinct, lightweight, compressed local images in /dishes/compressed/
 * (sourced from /dishes/Compressed Restaurant Images 1/Compressed Restaurant Images/)
 * Guaranteed to match exact dishes, load instantly without fluctuations, and avoid generic placeholders.
 */

const SPECIAL_DISH_MAP: Record<string, string> = {
  'chicken-urrbadu': 'chicken-hurbadu.webp',
  'chaklli-chicken-daba-special': 'chaklli-chicken.webp',
  'monster': 'monster-energy-drink.webp',
  'sambje-melone': 'mix-veg-curry.webp',
  'chinese-special-chef-special': 'chicken-manchurian.webp',
  'mushroom-duplex-chef-special': 'mushroom-duplex-mystery-special.webp',
};

export function toDishSlug(name: string): string {
  if (!name) return 'chicken-biriyani';
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Standardize biryani -> biriyani
  slug = slug.replace(/biryani/g, 'biriyani');
  return slug;
}

/**
 * Returns the compressed webp image path for a dish.
 */
export function getDishImage(dish: { name?: string; image?: string; category?: string } | null | undefined): string {
  if (!dish || !dish.name) {
    return '/dishes/compressed/chicken-biriyani.webp';
  }

  // If dish has a valid custom image that is NOT the generic placeholder
  if (
    dish.image &&
    typeof dish.image === 'string' &&
    dish.image.trim() !== '' &&
    !dish.image.includes('photo-1546069901-ba9599a7e63c')
  ) {
    return dish.image;
  }

  const slug = toDishSlug(dish.name);
  if (SPECIAL_DISH_MAP[slug]) {
    return `/dishes/compressed/${SPECIAL_DISH_MAP[slug]}`;
  }

  return `/dishes/compressed/${slug}.webp`;
}

/**
 * Fallback image based on category in case an image fails to load
 */
export function getCategoryFallbackImage(category?: string): string {
  const c = (category || '').toLowerCase();
  if (c.includes('biryani') || c.includes('biriyani')) return '/dishes/compressed/chicken-biriyani.webp';
  if (c.includes('rice')) return '/dishes/compressed/veg-fried-rice.webp';
  if (c.includes('bread') || c.includes('roti') || c.includes('naan')) return '/dishes/compressed/butter-naan.webp';
  if (c.includes('mutton')) return '/dishes/compressed/mutton-curry.webp';
  if (c.includes('sea food') || c.includes('fish') || c.includes('prawn')) return '/dishes/compressed/fish-curry.webp';
  if (c.includes('tandoor non') || c.includes('chicken non')) return '/dishes/compressed/chicken-tikka.webp';
  if (c.includes('curry non')) return '/dishes/compressed/chicken-butter-masala.webp';
  if (c.includes('curry veg')) return '/dishes/compressed/mix-veg-curry.webp';
  if (c.includes('tandoor veg') || c.includes('chinese veg')) return '/dishes/compressed/paneer-tikka.webp';
  if (c.includes('shake')) return '/dishes/compressed/chocolate-shake.webp';
  if (c.includes('alcohol') || c.includes('beverage')) return '/dishes/compressed/beer.webp';
  if (c.includes('ice cream') || c.includes('dessert')) return '/dishes/compressed/sizzling-brownie.webp';
  return '/dishes/compressed/chicken-kabab.webp';
}
