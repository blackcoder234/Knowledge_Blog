import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderName = (formData.get('folder') as string) || 'general'; // Default to 'general'

    // Simple validation for allowed folders to keep things organized
    const allowedFolders = ['avatars', 'posts', 'general'];
    const targetFolder = allowedFolders.includes(folderName) ? `knowledgelog/${folderName}` : 'knowledgelog/misc';

    if (!file) {
      return NextResponse.json(
        { error: 'No file received.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    // We use a promise wrapper because cloudinary.uploader.upload_stream accepts a callback
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({ 
        url: result.secure_url,
        public_id: result.public_id 
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
