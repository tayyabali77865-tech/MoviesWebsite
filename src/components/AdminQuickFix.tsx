"use client";

import { useState } from 'react';

type Preview = {
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  embedUrl: string | null;
  host?: string;
  iframeFound?: boolean;
};

export default function AdminQuickFix() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function fetchInfo() {
    setError(null);
    setPreview(null);
    if (!url) return setError('Please enter a URL');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/moviebox/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to fetch metadata');
      } else {
        setPreview({
          title: data.title || null,
          description: data.description || null,
          thumbnail: data.thumbnail || null,
          embedUrl: data.embedUrl || null,
          host: data.host,
          iframeFound: data.iframeFound,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }

  async function confirmImport() {
    if (!preview) return;
    setImporting(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/moviebox/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Import failed');
      } else {
        setSuccessMsg(`Imported: ${data.video.title} (id: ${data.video.id})`);
        setPreview(null);
        setUrl('');
      }
    } catch (err: any) {
      setError(err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-lg border border-white/5">
      <div className="flex gap-2 items-center mb-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste MovieBox or mirror URL"
          className="flex-1 px-3 py-2 rounded-md bg-zinc-800 border border-white/5 text-white"
        />
        <button
          onClick={fetchInfo}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white"
        >
          {loading ? 'Fetching…' : 'Fetch Info'}
        </button>
      </div>

      {error && <div className="text-sm text-red-400 mb-4">{error}</div>}

      {preview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div className="col-span-1">
            <div className="w-full bg-black rounded-md overflow-hidden">
              {preview.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.thumbnail} alt={preview.title || 'thumbnail'} className="w-full h-auto" />
              ) : (
                <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-400">No thumbnail</div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400">Host: {preview.host}</div>
          </div>

          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-white">{preview.title || 'Untitled'}</h3>
            <p className="text-sm text-gray-300 mt-2">{preview.description || 'No description available'}</p>

            {preview.embedUrl && (
              <div className="mt-4">
                <div className="relative w-full pb-[56.25%] bg-black rounded-md overflow-hidden">
                  <iframe
                    src={preview.embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allow="autoplay; fullscreen; picture-in-picture"
                    referrerPolicy="origin"
                    loading="lazy"
                    title={preview.title || 'embed'}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={confirmImport}
                disabled={importing}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md text-white"
              >
                {importing ? 'Importing…' : 'Confirm & Import'}
              </button>
              <button
                onClick={() => { setPreview(null); setError(null); }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-md text-white"
              >
                Cancel
              </button>
            </div>

            {successMsg && <div className="text-sm text-green-400 mt-3">{successMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
