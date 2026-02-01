import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const type = (formData.get('type') as string) || 'image'; // 'image' | 'video'

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 });
  }

  const allowed = type === 'video' ? ALLOWED_VIDEO : ALLOWED_IMAGE;
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid type. Allowed: ${type === 'video' ? 'mp4, webm' : 'jpeg, png, webp, gif'}` },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name) || (type === 'video' ? '.mp4' : '.jpg');
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
  const subdir = type === 'video' ? 'videos' : 'images';
  const dir = path.join(UPLOAD_DIR, subdir);

  try {
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, name);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
    const url = `/uploads/${subdir}/${name}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
