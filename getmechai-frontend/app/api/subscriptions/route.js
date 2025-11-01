import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { subscriptionSchema, ethereumAddressSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/validation';

// GET subscriptions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriberAddress = searchParams.get('subscriber');
    const creatorAddress = searchParams.get('creator');

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limitCheck = rateLimit(ip, 100, 60000);
    
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const where = {};

    if (subscriberAddress) {
      const validation = ethereumAddressSchema.safeParse(subscriberAddress);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid subscriber address' },
          { status: 400 }
        );
      }
      where.subscriberAddress = subscriberAddress.toLowerCase();
    }

    if (creatorAddress) {
      const validation = ethereumAddressSchema.safeParse(creatorAddress);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid creator address' },
          { status: 400 }
        );
      }
      where.creatorAddress = creatorAddress.toLowerCase();
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        creator: {
          select: {
            name: true,
            walletAddress: true,
            profileImage: true,
            subscriptionPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Update isActive based on expiry
    const now = new Date();
    const updatedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      isActive: new Date(sub.expiry) > now,
    }));

    return NextResponse.json(updatedSubscriptions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create/update subscription
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limitCheck = rateLimit(ip, 20, 60000);
    
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { subscriberAddress, creatorAddress, expiry, txHash } = body;

    // Validate addresses
    const subscriberValidation = ethereumAddressSchema.safeParse(subscriberAddress);
    const creatorValidation = ethereumAddressSchema.safeParse(creatorAddress);

    if (!subscriberValidation.success || !creatorValidation.success) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { walletAddress: creatorAddress.toLowerCase() },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Upsert subscription
    const subscription = await prisma.subscription.upsert({
      where: {
        subscriberAddress_creatorAddress: {
          subscriberAddress: subscriberAddress.toLowerCase(),
          creatorAddress: creatorAddress.toLowerCase(),
        },
      },
      update: {
        expiry: new Date(expiry * 1000), // Convert from Unix timestamp
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        subscriberAddress: subscriberAddress.toLowerCase(),
        creatorAddress: creatorAddress.toLowerCase(),
        expiry: new Date(expiry * 1000),
        isActive: true,
      },
      include: {
        creator: {
          select: {
            name: true,
            walletAddress: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        address: subscriberAddress.toLowerCase(),
        action: 'subscribe',
        metadata: { 
          creatorAddress: creatorAddress.toLowerCase(),
          expiry,
        },
        txHash,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update autopay balance
export async function PATCH(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limitCheck = rateLimit(ip, 20, 60000);
    
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { subscriberAddress, creatorAddress, autoPayBalance } = body;

    // Validate addresses
    const subscriberValidation = ethereumAddressSchema.safeParse(subscriberAddress);
    const creatorValidation = ethereumAddressSchema.safeParse(creatorAddress);

    if (!subscriberValidation.success || !creatorValidation.success) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.update({
      where: {
        subscriberAddress_creatorAddress: {
          subscriberAddress: subscriberAddress.toLowerCase(),
          creatorAddress: creatorAddress.toLowerCase(),
        },
      },
      data: {
        autoPayBalance,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
