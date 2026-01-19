import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/db';
import Media from '@/models/Media';

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

    await dbConnect();

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

    // Save to Database
    const newMedia = await Media.create({
        url: result.secure_url,
        publicId: result.public_id,
        filename: file.name,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        folder: folderName,
        altText: ''
    });

    return NextResponse.json({ 
        url: result.secure_url,
        public_id: result.public_id,
        media_id: newMedia._id
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
