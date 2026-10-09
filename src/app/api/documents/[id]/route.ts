import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@/server/services/document-service';
import { authService } from '@/server/services/auth-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to access confidential property documents.' },
        { status: 401 }
      );
    }

    const { document, fileBuffer } = await documentService.getDocumentFile(user, id);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': document.mimeType || 'application/pdf',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${document.fileName}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    if (err.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to access this confidential document.' },
        { status: 403 }
      );
    }
    if (err.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Document not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
