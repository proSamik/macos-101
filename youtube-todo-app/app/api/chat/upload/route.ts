import { auth } from '@/lib/auth';
import { BlobStorage } from '@/lib/blob-helpers';
import { NextRequest, NextResponse } from 'next/server';

// Allow larger file uploads for images
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate all files before uploading
    const validationErrors: string[] = [];
    files.forEach((file, index) => {
      if (!BlobStorage.validateFileType(file)) {
        validationErrors.push(`File ${index + 1}: Invalid file type. Allowed types: image/*`);
      }
      if (!BlobStorage.validateFileSize(file)) {
        validationErrors.push(`File ${index + 1}: File too large. Maximum size is 10MB.`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'File validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Upload files
    let uploadedFiles;
    
    if (files.length === 1) {
      uploadedFiles = [await BlobStorage.uploadFile(files[0], session.user.id)];
    } else {
      uploadedFiles = await BlobStorage.uploadMultipleFiles(files, session.user.id);
    }

    return NextResponse.json({ 
      files: uploadedFiles,
      count: uploadedFiles.length 
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading files:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const urls = searchParams.getAll('url');

    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { error: 'No file URLs provided' },
        { status: 400 }
      );
    }

    // Delete files
    let result;
    
    if (urls.length === 1) {
      const success = await BlobStorage.deleteFile(urls[0]);
      result = { 
        success: success ? urls : [], 
        failed: success ? [] : urls 
      };
    } else {
      result = await BlobStorage.deleteMultipleFiles(urls);
    }

    return NextResponse.json({
      deleted: result.success.length,
      failed: result.failed.length,
      details: result
    });

  } catch (error) {
    console.error('Error deleting files:', error);
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}