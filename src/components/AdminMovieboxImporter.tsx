"use client";

import { useState } from 'react';

export default function AdminMovieboxImporter() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!url) return setMessage('Please provide a MovieBox URL');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/moviebox/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || 'Import failed');
      } else if (data?.video) {
        setMessage(`Imported: ${data.video.title} (id: ${data.video.id})`);
        setUrl('');
        // Optionally trigger a reload or redirect to edit page
      } else {
        setMessage('Import completed');
      }
    } catch (err: any) {
      setMessage(err?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleImport} className="flex items-center gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste MovieBox video URL"
        className="px-3 py-2 rounded-md bg-zinc-800 border border-white/5 text-white w-[420px]"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white"
      >
        {loading ? 'Importing…' : 'Import & Save'}
      </button>
      {message && <div className="text-sm text-white/80">{message}</div>}
    </form>
  );
}
