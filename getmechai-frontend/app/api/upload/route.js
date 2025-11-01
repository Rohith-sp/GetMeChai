import { NextResponse } from 'next/server';
import { uploadToIPFS } from '@/lib/ipfs';
import { rateLimit } from '@/lib/validation';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limitCheck = rateLimit(ip, 10, 60000); // 10 uploads per minute
    
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const uploaderAddress = formData.get('uploaderAddress');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!uploaderAddress) {
      return NextResponse.json(
        { error: 'Uploader address required' },
        { status: 400 }
      );
    }

    // Convert to File object if needed
    const fileToUpload = file instanceof File ? file : new File([file], file.name);

    // Upload to IPFS
    const result = await uploadToIPFS(fileToUpload, {
      uploadedBy: uploaderAddress,
      keyvalues: {
        app: 'getmechai',
        uploader: uploaderAddress,
      },
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    // Extract meaningful error message
    let errorMessage = 'Upload failed';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    
    // Add helpful context for common errors
    if (errorMessage.includes('credentials') || errorMessage.includes('unauthorized') || errorMessage.includes('Pinata credentials not configured')) {
      errorMessage = 'Pinata API credentials are invalid or missing. Please check your .env.local file.';
    } else if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to Pinata. Please check your internet connection.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
