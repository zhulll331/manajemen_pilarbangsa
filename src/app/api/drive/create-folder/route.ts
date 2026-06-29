import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/utils/drive';

export async function POST(request: NextRequest) {
  try {
    const { folderName, parentFolderName } = await request.json();
    if (!folderName) {
      return NextResponse.json({ error: 'folderName is required' }, { status: 400 });
    }

    const drive = getDriveClient();
    let targetParentFolderId = process.env.NEXT_PUBLIC_DRIVE_PARENT_FOLDER_ID;

    if (!targetParentFolderId) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_DRIVE_PARENT_FOLDER_ID is not configured' }, { status: 500 });
    }

    // 1. Jika ada parentFolderName (misal: "Sekretaris", "Bendahara", "Divisi - Humas & Kerjasama"), cari atau buat folder induk tersebut dulu
    if (parentFolderName) {
      const pSearchRes = await drive.files.list({
        q: `name = '${parentFolderName}' and '${targetParentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (pSearchRes.data.files && pSearchRes.data.files.length > 0) {
        targetParentFolderId = pSearchRes.data.files[0].id ?? targetParentFolderId;
      } else {
        // Buat folder induk baru di dalam folder utama (Dosen)
        const pCreateRes = await drive.files.create({
          requestBody: {
            name: parentFolderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [targetParentFolderId],
          },
          supportsAllDrives: true,
          fields: 'id, name',
        });
        if (pCreateRes.data.id) {
          targetParentFolderId = pCreateRes.data.id ?? targetParentFolderId;
        }
      }
    }

    // 2. Cek apakah folder target (misal: "Arsip - SK", "Bukti Kas Pemasukan", "Proker - ...") sudah ada di dalam targetParentFolderId
    const searchResponse = await drive.files.list({
      q: `name = '${folderName}' and '${targetParentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      return NextResponse.json({ folderId: searchResponse.data.files[0].id, name: searchResponse.data.files[0].name });
    }

    // 3. Jika belum ada, buat folder baru di dalam targetParentFolderId
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [targetParentFolderId],
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      supportsAllDrives: true,
      fields: 'id, name',
    });

    return NextResponse.json({ folderId: response.data.id, name: response.data.name });
  } catch (error: any) {
    console.error('Error creating/searching folder:', error);
    return NextResponse.json({ error: error.message || 'Failed to create folder' }, { status: 500 });
  }
}
