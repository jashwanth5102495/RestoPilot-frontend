/**
 * Dish image resolver utility
 * Maps dishes to their distinct, lightweight, optimized local images in /dished/
 * Guaranteed to never return broken placeholders or the generic salad image.
 */

export function toDishSlug(name: string): string {
  if (!name) return 'default-dish';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns the local image path for a dish.
 * Guarantees no generic salad placeholder (photo-1546069901-ba9599a7e63c).
 */
export function getDishImage(dish: { name?: string; image?: string; category?: string } | null | undefined): string {
  if (!dish || !dish.name) {
    return '/dished/biryani.jpg';
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
  return `/dished/${slug}.jpg`;
}

/**
 * Fallback image based on category in case an image fails to load
 */
export function getCategoryFallbackImage(category?: string): string {
  const c = (category || '').toLowerCase();
  if (c.includes('biryani') || c.includes('biriyani')) return '/dished/biryani.jpg';
  if (c.includes('rice')) return '/dished/fried-rice.jpg';
  if (c.includes('bread')) return '/dished/naan.jpg';
  if (c.includes('mutton')) return '/dished/mutton-roast.jpg';
  if (c.includes('sea food') || c.includes('fish') || c.includes('prawn')) return '/dished/fish-fry.jpg';
  if (c.includes('tandoor non') || c.includes('chicken non')) return '/dished/tandoori-chicken.jpg';
  if (c.includes('curry non')) return '/dished/butter-chicken.jpg';
  if (c.includes('curry veg')) return '/dished/paneer-curry.jpg';
  if (c.includes('tandoor veg') || c.includes('chinese veg')) return '/dished/paneer-tikka.jpg';
  if (c.includes('shake')) return '/dished/milkshake.jpg';
  if (c.includes('mocktail')) return '/dished/mocktail.jpg';
  if (c.includes('alcohol') || c.includes('beverage')) return '/dished/beer.jpg';
  if (c.includes('dessert')) return '/dished/brownie-dessert.jpg';
  if (c.includes('breakfast')) return '/dished/omelette.jpg';
  return '/dished/chicken-starter.jpg';
}
