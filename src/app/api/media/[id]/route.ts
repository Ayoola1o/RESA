import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { mediaService } from '@/server/services/media-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await mediaService.findMediaById(id);

    if (!item) {
      return new NextResponse('Media not found', { status: 404 });
    }

    const { media } = item;

    // If locally stored file exists
    if (media.fileReference) {
      const diskPath = mediaService.getDiskFilePath(media.fileReference);

      if (fs.existsSync(diskPath)) {
        const fileBuffer = await fs.promises.readFile(diskPath);
        const mimeType =
          media.mimeType ||
          (media.type === 'video' ? 'video/mp4' : 'image/jpeg');

        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            'Content-Type': mimeType,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        });
      }
    }

    // Fallback: If media has a remote URL (e.g. CDN or initial seed), redirect to it
    if (media.url && !media.url.startsWith('/api/media/')) {
      return NextResponse.redirect(media.url);
    }

    return new NextResponse('Media file content not available', { status: 404 });
  } catch (err: any) {
    console.error('Error serving media file:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
