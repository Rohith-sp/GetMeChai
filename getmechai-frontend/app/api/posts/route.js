import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { postCreationSchema, ethereumAddressSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/validation';
import { isValidIPFSHash } from '@/lib/ipfs';

// GET posts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorAddress = searchParams.get('creator');
    const isFree = searchParams.get('free');
    const postId = searchParams.get('postId');

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limitCheck = rateLimit(ip, 100, 60000);
    
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Build query
    const where = {};
    
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

    if (isFree !== null && isFree !== undefined) {
      where.isFree = isFree === 'true';
    }

    if (postId) {
      where.postId = parseInt(postId);
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        creator: {
          select: {
            name: true,
            walletAddress: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            postContributions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create post
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
    
    // Validate input
    const validation = postCreationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { postId, creatorAddress, ipfsHash, caption, isFree } = body;

    // Validate creator address
    const addressValidation = ethereumAddressSchema.safeParse(creatorAddress);
    if (!addressValidation.success) {
      return NextResponse.json(
        { error: 'Invalid creator address' },
        { status: 400 }
      );
    }

    // Validate IPFS hash
    if (!isValidIPFSHash(ipfsHash)) {
      return NextResponse.json(
        { error: 'Invalid IPFS hash format' },
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

    // Create post
    const post = await prisma.post.create({
      data: {
        postId: parseInt(postId),
        creatorAddress: creatorAddress.toLowerCase(),
        ipfsHash,
        caption: caption || '',
        isFree: isFree || false,
      },
      include: {
        creator: {
          select: {
            name: true,
            walletAddress: true,
            profileImage: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        address: creatorAddress.toLowerCase(),
        action: 'post',
        metadata: { postId: post.postId, isFree },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Post ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
