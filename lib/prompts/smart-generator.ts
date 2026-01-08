/**
 * Smart Prompt Generator
 * Generates context-aware video prompts based on product type
 * Analyzes product description to create optimal cinematographic prompts
 */

/**
 * Extract product name from description
 * Takes first significant phrase (max 6 words)
 */
function extractProductName(description: string): string {
  const words = description.split(' ').slice(0, 6).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Generate smart video prompt based on product type detection
 * @param description - Product description from Florence-2 model
 * @returns Optimized prompt for video generation
 */
export function generateSmartPrompt(description: string): string {
  const desc = description.toLowerCase();
  const productName = extractProductName(description);

  // Beverage products
  if (
    desc.includes('can') ||
    desc.includes('bottle') ||
    desc.includes('drink') ||
    desc.includes('cola') ||
    desc.includes('beverage') ||
    desc.includes('soda') ||
    desc.includes('beer') ||
    desc.includes('water')
  ) {
    return `${productName} slowly rotating on a reflective dark surface, condensation droplets glistening on the surface, cool blue studio lighting with warm accent lights, premium beverage commercial aesthetic, smooth 360 rotation, cinematic quality`;
  }

  // Electronics (phones, laptops, devices)
  if (
    desc.includes('phone') ||
    desc.includes('laptop') ||
    desc.includes('device') ||
    desc.includes('electronic') ||
    desc.includes('screen') ||
    desc.includes('tablet') ||
    desc.includes('computer') ||
    desc.includes('camera') ||
    desc.includes('headphone')
  ) {
    return `${productName} floating and rotating in a minimalist dark environment, subtle holographic reflections, premium tech product showcase, smooth cinematic camera orbit, Apple-style commercial aesthetic`;
  }

  // Fashion & Accessories (shoes, watches, bags, jewelry)
  if (
    desc.includes('shoe') ||
    desc.includes('watch') ||
    desc.includes('bag') ||
    desc.includes('clothing') ||
    desc.includes('jewelry') ||
    desc.includes('accessory') ||
    desc.includes('purse') ||
    desc.includes('wallet') ||
    desc.includes('belt') ||
    desc.includes('hat')
  ) {
    return `${productName} elegantly displayed with dramatic side lighting, subtle rotation revealing details, luxury fashion photography style, soft shadows, high-end commercial quality`;
  }

  // Food products
  if (
    desc.includes('food') ||
    desc.includes('snack') ||
    desc.includes('package') ||
    desc.includes('box') ||
    desc.includes('bag') ||
    desc.includes('cookie') ||
    desc.includes('chip') ||
    desc.includes('candy') ||
    desc.includes('chocolate')
  ) {
    return `${productName} on a clean surface with appetizing presentation, warm golden lighting, gentle camera push-in, food photography commercial style, mouth-watering aesthetic`;
  }

  // Cosmetics & Beauty
  if (
    desc.includes('cosmetic') ||
    desc.includes('makeup') ||
    desc.includes('perfume') ||
    desc.includes('fragrance') ||
    desc.includes('lipstick') ||
    desc.includes('beauty') ||
    desc.includes('skincare') ||
    desc.includes('lotion')
  ) {
    return `${productName} on elegant marble surface, soft diffused lighting with subtle pink and gold accents, gentle rotation revealing label, luxury beauty commercial aesthetic, premium product photography`;
  }

  // Home & Decor
  if (
    desc.includes('vase') ||
    desc.includes('lamp') ||
    desc.includes('candle') ||
    desc.includes('decor') ||
    desc.includes('furniture') ||
    desc.includes('pillow') ||
    desc.includes('plant')
  ) {
    return `${productName} in a modern minimalist setting, natural window lighting, slow camera dolly creating depth, interior design magazine aesthetic, warm inviting atmosphere`;
  }

  // Toys & Games
  if (
    desc.includes('toy') ||
    desc.includes('game') ||
    desc.includes('doll') ||
    desc.includes('figure') ||
    desc.includes('puzzle') ||
    desc.includes('card')
  ) {
    return `${productName} on colorful vibrant background, playful dynamic lighting, gentle rotation showing all angles, fun energetic commercial style, bright cheerful atmosphere`;
  }

  // Default template for unknown product types
  return `${productName} product showcase, slowly rotating 360 degrees, professional studio lighting with soft shadows, clean white background, premium commercial photography style, smooth cinematic motion`;
}

/**
 * Get default negative prompt for all product videos
 * Prevents common quality issues
 */
export function getDefaultNegativePrompt(): string {
  return 'blur, distort, low quality, pixelated, shaky, text overlay, watermark, poor lighting, overexposed, underexposed';
}
