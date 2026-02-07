import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Allow common mirrors by default; if unknown host then probe for iframe
    const allowedHostPattern = /(moviebox|123movienow|123movie|movienow|movier|123movies|moviz|movierulz|movizland|watchmovies)/i;
    if (!allowedHostPattern.test(parsed.hostname)) {
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
    const description = (
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''
    ).trim();

    const thumbnail = (
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null
    );

    // Find embed iframe
    let iframeSrc: string | null = null;
    const iframe = $('iframe[src]').first();
    if (iframe && iframe.attr('src')) iframeSrc = iframe.attr('src') as string;

    if (!iframeSrc) {
      const dataSrc = $('[data-src]').attr('data-src');
      if (dataSrc) iframeSrc = dataSrc as string;
    }

    // Normalize relative iframe URLs
    if (iframeSrc) {
      try {
        if (iframeSrc.startsWith('//')) iframeSrc = `${parsed.protocol}${iframeSrc}`;
        if (iframeSrc.startsWith('/')) iframeSrc = new URL(iframeSrc, parsed.origin).toString();
        if (!/^https?:\/\//i.test(iframeSrc)) iframeSrc = new URL(iframeSrc, parsed.origin).toString();
      } catch (e) {
        iframeSrc = null;
      }
    }

    const embedUrl = iframeSrc || url;

    return NextResponse.json({
      title: title || null,
      description: description || null,
      thumbnail: thumbnail || null,
      embedUrl,
      host: parsed.hostname,
      iframeFound: Boolean(iframeSrc),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Fetch failed' }, { status: 500 });
  }
}
