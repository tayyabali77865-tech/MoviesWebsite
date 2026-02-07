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

    // Basic host validation for moviebox and mirrors
    const hostPattern = /^([\w-]+\.)?(moviebox|123movienow|123movie|movienow|movier|123movies|moviz|movierulz|movizland|watchmovies)/i;
    if (!hostPattern.test(parsed.hostname)) {
      // Probe unknown hosts for an iframe before rejecting
      const probeRes = await fetch(url, { headers: { 'User-Agent': 'Complet-Admin/1.0' } });
      const probeHtml = await probeRes.text().catch(() => '');
      const $$ = cheerio.load(probeHtml);
      const possibleIframe = $$('iframe[src]').first();
      if (!possibleIframe || !possibleIframe.attr('src')) {
        return NextResponse.json({ error: 'Only MovieBox or compatible mirror URLs are accepted' }, { status: 400 });
      }
    }

    const res = await fetch(url, { headers: { 'User-Agent': 'Complet-Admin/1.0' } });
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch source page' }, { status: 502 });

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = ($('title').first().text() || $('meta[property="og:title"]').attr('content') || '').trim();
    let description = (
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''
    ).trim();
    if (!description) description = undefined as any;

    let thumbnail = (
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      undefined
    );

    // Resolve relative thumbnail URLs
    if (thumbnail) {
      thumbnail = thumbnail.trim();
      try {
        if (thumbnail.startsWith('//')) thumbnail = `${parsed.protocol}${thumbnail}`;
        if (thumbnail.startsWith('/')) thumbnail = new URL(thumbnail, parsed.origin).toString();
        if (!/^https?:\/\//i.test(thumbnail)) thumbnail = new URL(thumbnail, parsed.origin).toString();
      } catch (e) {
        thumbnail = undefined;
      }
    }

    // Find the first iframe on the page
    let iframeSrc: string | null = null;
    const iframe = $('iframe[src]').first();
    if (iframe && iframe.attr('src')) iframeSrc = iframe.attr('src') as string;

    // Resolve relative iframe URLs
    if (iframeSrc) {
      iframeSrc = iframeSrc.trim();
      try {
        if (iframeSrc.startsWith('//')) iframeSrc = `${parsed.protocol}${iframeSrc}`;
        if (iframeSrc.startsWith('/')) iframeSrc = new URL(iframeSrc, parsed.origin).toString();
        if (!/^https?:\/\//i.test(iframeSrc)) iframeSrc = new URL(iframeSrc, parsed.origin).toString();
      } catch (e) {
        iframeSrc = null;
      }
    }

    // Create database record
    const created = await prisma.video.create({
      data: {
        title: title || 'Untitled Movie',
        description: description || undefined,
        thumbnailUrl: thumbnail || '',
        movieboxUrl: iframeSrc || url,
        type: 'movie',
      },
    });

    return NextResponse.json({ video: created, embedSaved: Boolean(iframeSrc) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Import failed' }, { status: 500 });
  }
}
