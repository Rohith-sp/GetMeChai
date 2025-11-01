import { z } from 'zod';

// Ethereum address validation
export const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

// Creator registration validation
export const creatorRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  subscriptionPrice: z.string().regex(/^\d+$/, 'Invalid price format'),
  bio: z.string().max(500, 'Bio too long').optional(),
  profileImage: z.string().url('Invalid image URL').optional(),
});

// Post creation validation
export const postCreationSchema = z.object({
  ipfsHash: z.string().min(1, 'IPFS hash required'),
  caption: z.string().max(1000, 'Caption too long').optional(),
  isFree: z.boolean(),
});

// Contribution validation
export const contributionSchema = z.object({
  postId: z.number().int().positive(),
  amount: z.string().regex(/^\d+$/, 'Invalid amount format'),
});

// Subscription validation
export const subscriptionSchema = z.object({
  creatorAddress: ethereumAddressSchema,
  amount: z.string().regex(/^\d+$/, 'Invalid amount format'),
});

// Rate limiting helper
const rateLimitMap = new Map();

export function rateLimit(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];
  
  // Filter out old requests
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: new Date(recentRequests[0] + windowMs),
    };
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  return {
    success: true,
    remaining: limit - recentRequests.length,
    resetAt: new Date(now + windowMs),
  };
}

// Clean up old rate limit entries periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const recent = timestamps.filter(t => now - t < 60000);
      if (recent.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, recent);
      }
    }
  }, 60000);
}
