/**
 * Pricing Plans and Credit Tiers
 * Defines the credit packages available for purchase
 */

export const PRICING_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    credits: 3,
    price: 0,
    pricePerVideo: 0,
    stripeProductId: null,
    features: [
      '3 video credits',
      'All 4 vibes',
      '720p export',
      'Full pipeline access',
    ],
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 29,
    pricePerVideo: 0.58,
    stripeProductId: process.env.STRIPE_STARTER_PRODUCT_ID,
    features: [
      '50 video credits',
      '$0.58 per video',
      'Priority processing',
      'Email support',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    credits: 250,
    price: 99,
    pricePerVideo: 0.40,
    stripeProductId: process.env.STRIPE_PRO_PRODUCT_ID,
    features: [
      '250 video credits',
      '$0.40 per video',
      'Custom prompts',
      'Batch processing',
    ],
  },
  AGENCY: {
    id: 'agency',
    name: 'Agency',
    credits: 1000,
    price: 299,
    pricePerVideo: 0.30,
    stripeProductId: process.env.STRIPE_AGENCY_PRODUCT_ID,
    features: [
      '1000 video credits',
      '$0.30 per video',
      'API access',
      'Priority support',
      'Custom branding',
    ],
  },
} as const;

export type PlanId = keyof typeof PRICING_PLANS;

/**
 * Get plan details by ID
 */
export function getPlan(planId: PlanId) {
  return PRICING_PLANS[planId];
}

/**
 * Get all available plans
 */
export function getAllPlans() {
  return Object.values(PRICING_PLANS);
}

/**
 * Get paid plans only (exclude free)
 */
export function getPaidPlans() {
  return Object.values(PRICING_PLANS).filter((plan) => plan.price > 0);
}
