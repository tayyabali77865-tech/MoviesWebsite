import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';

function normalizeHostList(env?: string) {
  if (!env) return [] as string[];
  return env.split(',').map(s => s.trim()).filter(Boolean);
}

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

    // Default allowed hostnames (moviebox and common mirrors)
    const defaultAllowed = [
      'moviebox', '123movienow', '123movie', 'movienow', 'movier', '123movies',
      'moviz', 'movierulz', 'movizland', 'watchmovies'
    ];

    // Allow additional hosts via environment variable MOVIEBOX_ALLOWED_HOSTS (comma separated)
    const extraAllowed = normalizeHostList(process.env.MOVIEBOX_ALLOWED_HOSTS);

    const allowedHostnames = new Set([...defaultAllowed, ...extraAllowed].map(h => h.toLowerCase()));

    // Helper to check hostname substrings (allow subdomains)
    const hostIsAllowed = (hostname: string) => {
      const host = hostname.toLowerCase();
      for (const allowed of allowedHostnames) {
        if (host === allowed) return true;
        if (host.endsWith('.' + allowed)) return true;
        if (host.includes(allowed)) return true; // conservative: allow mirrors containing name
      }
      return false;
    };

    // Probe unknown hosts for an iframe before allowing import
    if (!hostIsAllowed(parsed.hostname)) {
      const probeRes = await fetch(url, { headers: { 'User-Agent': 'Complet-Admin/1.0' } });
      const probeHtml = await probeRes.text().catch(() => '');
      const $$ = cheerio.load(probeHtml);
      const possibleIframe = $$('iframe[src]').first();
      if (!possibleIframe || !possibleIframe.attr('src')) {
        return NextResponse.json({ error: 'Only MovieBox or compatible mirror URLs are accepted' }, { status: 400 });
      }
      // else continue; we'll still validate the embedded iframe further below
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
    // Cap description to avoid extremely large blobs
    if (typeof description === 'string' && description.length > 3000) description = description.slice(0, 3000);

    let thumbnail = (
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      undefined
    );

    // Resolve and sanitize thumbnail
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

    // Find the first iframe on the page (common pattern for MovieBox embeds)
    let iframeSrc: string | null = null;
    const iframe = $('iframe[src]').first();
    if (iframe && iframe.attr('src')) iframeSrc = iframe.attr('src') as string;

    // Fallback: look for data-src or script-based embeds
    if (!iframeSrc) {
      const dataSrc = $('[data-src]').attr('data-src');
      if (dataSrc) iframeSrc = dataSrc as string;
    }

    // Resolve relative URLs and sanitize iframe src
    if (iframeSrc) {
      iframeSrc = iframeSrc.trim();

      // Reject javascript:, data:, vbscript: or other non-http protocols
      const lower = iframeSrc.toLowerCase();
      if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
        iframeSrc = null;
      } else {
        try {
          if (iframeSrc.startsWith('//')) iframeSrc = `${parsed.protocol}${iframeSrc}`;
          if (iframeSrc.startsWith('/')) iframeSrc = new URL(iframeSrc, parsed.origin).toString();
          if (!/^https?:\/\//i.test(iframeSrc)) iframeSrc = new URL(iframeSrc, parsed.origin).toString();

          // validate the resolved embed host
          const embedParsed = new URL(iframeSrc);
          if (!hostIsAllowed(embedParsed.hostname)) {
            // If embed host isn't in allowlist, drop the embed to avoid saving untrusted external frames.
            iframeSrc = null;
          }
        } catch (e) {
          iframeSrc = null;
        }
      }
    }

    // If we don't have a sanitized iframe, we still keep the original page URL in movieboxUrl
    const embedUrl = iframeSrc || null; // save null if we intentionally dropped unsafe iframe

    // Create database record (auto-save behavior)
    const created = await prisma.video.create({
      data: {
        title: title || 'Untitled Movie',
        description: description || undefined,
        thumbnailUrl: thumbnail || '',
        movieboxUrl: embedUrl || url,
        type: 'movie',
      },
    });

    return NextResponse.json({ video: created, embedSaved: Boolean(embedUrl) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Import failed' }, { status: 500 });
  }
}
