import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/utils/drive';

export async function POST(request: NextRequest) {
  try {
    const { folderId, newName } = await request.json();
    if (!folderId || !newName) {
      return NextResponse.json({ error: 'folderId and newName are required' }, { status: 400 });
    }

    const drive = getDriveClient();

    const response = await drive.files.update({
      fileId: folderId,
      requestBody: {
        name: newName,
      },
      supportsAllDrives: true,
      fields: 'id, name',
    });

    return NextResponse.json({ success: true, folderId: response.data.id, name: response.data.name });
  } catch (error: any) {
    console.error('Error renaming folder:', error);
    return NextResponse.json({ error: error.message || 'Failed to rename folder' }, { status: 500 });
  }
}
