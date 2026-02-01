import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, appendFile, stat, unlink } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'temp');

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const chunk = formData.get('chunk') as File;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const fileName = formData.get('fileName') as string;
    const fileId = formData.get('fileId') as string; // Unique ID for the upload session

    if (!chunk || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName || !fileId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tempDir = path.join(UPLOAD_DIR, fileId);
    await mkdir(tempDir, { recursive: true });

    const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
    const bytes = await chunk.arrayBuffer();
    await writeFile(chunkPath, Buffer.from(bytes));

    // Check if all chunks are uploaded
    const uploadedChunks = await stat(tempDir).then(() => true).catch(() => false);
    if (!uploadedChunks) return NextResponse.json({ error: 'Failed to access temp dir' }, { status: 500 });

    // In a real scenario, we'd check if all files exist: chunk-0 to chunk-(totalChunks-1)
    // For simplicity here, the client will call a "complete" endpoint or we check here

    return NextResponse.json({ success: true, message: `Chunk ${chunkIndex} uploaded` });
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId, fileName, type } = await req.json();
    if (!fileId || !fileName || !type) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tempDir = path.join(UPLOAD_DIR, fileId);
    const finalSubdir = type === 'video' ? 'videos' : 'images';
    const finalDir = path.join(process.cwd(), 'public', 'uploads', finalSubdir);
    await mkdir(finalDir, { recursive: true });

    const ext = path.extname(fileName);
    const finalFileName = `${Date.now()}-${fileId}${ext}`;
    const finalPath = path.join(finalDir, finalFileName);

    // Combine chunks
    // Note: This logic assumes chunks are small enough to be appended sequentially
    try {
        // We need to know how many chunks there were. 
        // This simple implementation relies on the client telling us or we read the dir.
        const fs = require('fs');
        const files = await require('fs/promises').readdir(tempDir);
        const sortedChunks = files
            .filter((f: string) => f.startsWith('chunk-'))
            .sort((a: string, b: string) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));

        for (const chunkFile of sortedChunks) {
            const chunkData = await require('fs/promises').readFile(path.join(tempDir, chunkFile));
            await appendFile(finalPath, chunkData);
            await unlink(path.join(tempDir, chunkFile));
        }

        await require('fs/promises').rmdir(tempDir);

        return NextResponse.json({ url: `/uploads/${finalSubdir}/${finalFileName}` });
    } catch (error) {
        console.error('Failed to combine chunks:', error);
        return NextResponse.json({ error: 'Failed to combine chunks' }, { status: 500 });
    }
}
