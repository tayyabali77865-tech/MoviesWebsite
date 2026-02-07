import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const url = (body && body.url) || '';
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const parsed = new URL(url);

    // Basic host validation: only allow moviebox hostnames for this importer
    if (!/moviebox/i.test(parsed.hostname)) {
      return NextResponse.json({ error: 'Only MovieBox URLs are accepted' }, { status: 400 });
    }

    const res = await fetch(url, { headers: { 'User-Agent': 'Complet-Admin/1.0' } });
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch source page' }, { status: 502 });

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = ($('title').first().text() || $('meta[property="og:title"]').attr('content') || '').trim();
    const description = (
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''
    ).trim();

    let thumbnail = (
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      undefined
    );

    // Find the first iframe on the page (common pattern for MovieBox embeds)
    let iframeSrc: string | null = null;
    const iframe = $('iframe[src]').first();
    if (iframe && iframe.attr('src')) iframeSrc = iframe.attr('src') as string;

    // Fallback: look for data-src or script-based embeds
    if (!iframeSrc) {
      const dataSrc = $('[data-src]').attr('data-src');
      if (dataSrc) iframeSrc = dataSrc as string;
    }

    // Resolve relative URLs
    if (iframeSrc) {
      try {
        if (iframeSrc.startsWith('//')) iframeSrc = `${parsed.protocol}${iframeSrc}`;
        if (iframeSrc.startsWith('/')) iframeSrc = new URL(iframeSrc, parsed.origin).toString();
        if (!/^https?:\/\//i.test(iframeSrc)) iframeSrc = new URL(iframeSrc, parsed.origin).toString();
      } catch (e) {
        iframeSrc = null;
      }
    }

    // Store the page URL as movieboxUrl if no iframe found
    const embedUrl = iframeSrc || url;

    // Create database record (auto-save behavior)
    const created = await prisma.video.create({
      data: {
        title: title || 'Untitled Movie',
        description: description || undefined,
        thumbnailUrl: thumbnail || '',
        movieboxUrl: embedUrl,
        type: 'movie',
      },
    });

    return NextResponse.json({ video: created });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Import failed' }, { status: 500 });
  }
}
