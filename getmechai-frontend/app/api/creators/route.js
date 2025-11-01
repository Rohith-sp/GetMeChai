import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { creatorRegistrationSchema, ethereumAddressSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/validation';

// GET all creators
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limitCheck = rateLimit(ip, 100, 60000);
    
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitCheck.resetAt.toISOString(),
          },
        }
      );
    }

    if (address) {
      // Get specific creator
      const validation = ethereumAddressSchema.safeParse(address);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid address format' },
          { status: 400 }
        );
      }

      const creator = await prisma.creator.findUnique({
        where: { walletAddress: address.toLowerCase() },
        include: {
          posts: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              posts: true,
              subscribers: true,
            },
          },
        },
      });

      if (!creator) {
        return NextResponse.json(
          { error: 'Creator not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(creator);
    }

    // Get all creators
    const creators = await prisma.creator.findMany({
      where: { isRegistered: true },
      include: {
        _count: {
          select: {
            posts: true,
            subscribers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(creators);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create/update creator
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limitCheck = rateLimit(ip, 10, 60000);
    
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = creatorRegistrationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { walletAddress, name, subscriptionPrice, bio, profileImage } = body;

    // Validate wallet address
    const addressValidation = ethereumAddressSchema.safeParse(walletAddress);
    if (!addressValidation.success) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Upsert creator
    const creator = await prisma.creator.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {
        name,
        subscriptionPrice,
        bio,
        profileImage,
        updatedAt: new Date(),
      },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        name,
        subscriptionPrice,
        bio,
        profileImage,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        address: walletAddress.toLowerCase(),
        action: 'register',
        metadata: { name, subscriptionPrice },
      },
    });

    return NextResponse.json(creator, { status: 201 });
  } catch (error) {
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Creator already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
