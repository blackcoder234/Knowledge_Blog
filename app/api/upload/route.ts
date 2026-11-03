import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/db';
import Media from '@/models/Media';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { readLimitedFormData } from '@/lib/readLimitedFormData';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const MAX_UPLOAD_REQUEST_BYTES = MAX_UPLOAD_BYTES + MAX_MULTIPART_OVERHEAD_BYTES;
const STAFF_ROLES = ['editor', 'admin', 'super_admin'];
const ALLOWED_FOLDERS = ['avatars', 'banners', 'posts', 'general'];

function isSupportedImage(bytes: Buffer): boolean {
  return (
    (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (bytes.subarray(0, 3).toString('ascii') === 'GIF') ||
    (bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP')
  );
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    const formResult = await readLimitedFormData(request, MAX_UPLOAD_REQUEST_BYTES);
    if ('error' in formResult) {
      if (formResult.error === 'too_large') {
        return NextResponse.json({ error: 'Upload request exceeds the 5 MB file limit plus multipart overhead.' }, { status: 413 });
      }
      if (formResult.error === 'missing') {
        return NextResponse.json({ error: 'A valid multipart image upload is required.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Upload request must contain valid multipart form data.' }, { status: 400 });
    }

    const formData = formResult.formData;
    const file = formData.get('file');
    const folderValue = formData.get('folder');
    const folder = typeof folderValue === 'string' ? folderValue : 'general';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A valid image file is required.' }, { status: 400 });
    }
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: 'Unsupported upload folder.' }, { status: 400 });
    }
    if (folder !== 'avatars' && folder !== 'banners' && !STAFF_ROLES.includes(role || '')) {
      return NextResponse.json({ error: 'Staff access is required for this upload.' }, { status: 403 });
    }
    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Image must be between 1 byte and 5 MB.' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isSupportedImage(buffer)) {
      return NextResponse.json(
        { error: 'Unsupported image. Upload a genuine JPEG, PNG, GIF, or WebP file.' },
        { status: 415 }
      );
    }

    await dbConnect();
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const existingMedia = await Media.findOne({ hash: fileHash });
    if (existingMedia) {
      return NextResponse.json({
        url: existingMedia.url,
        public_id: existingMedia.publicId,
        media_id: existingMedia._id,
        reused: true,
      });
    }

    const targetFolder = `knowledgelog/${folder}`;
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      format?: string;
      bytes?: number;
      width?: number;
      height?: number;
    }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          max_file_size: MAX_UPLOAD_BYTES,
        },
        (error, uploaded) => {
          if (error) {
            reject(error);
          } else if (uploaded) {
            resolve(uploaded);
          } else {
            reject(new Error('Cloudinary returned no upload result.'));
          }
        }
      ).end(buffer);
    });

    const media = await Media.create({
      url: result.secure_url,
      publicId: result.public_id,
      filename: file.name.slice(0, 255),
      format: result.format,
      size: result.bytes || buffer.length,
      width: result.width,
      height: result.height,
      folder,
      altText: '',
      hash: fileHash,
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      media_id: media._id,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });
  }
}
