'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadFieldProps {
  type: 'image' | 'video';
  onUrl: (url: string) => void;
  disabled?: boolean;
}

export function UploadField({ type, onUrl, disabled }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setProgress(0);
    setLoading(true);

    try {
      if (file.size < 5 * 1024 * 1024) { // Use normal upload for < 5MB
        const formData = new FormData();
        formData.set('file', file);
        formData.set('type', type);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        onUrl(data.url);
      } else {
        // Chunked upload
        const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append('chunk', chunk);
          formData.append('chunkIndex', i.toString());
          formData.append('totalChunks', totalChunks.toString());
          formData.append('fileName', file.name);
          formData.append('fileId', fileId);

          const res = await fetch('/api/admin/videos/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Chunk upload failed');

          setProgress(Math.round(((i + 1) / totalChunks) * 100));
        }

        // Finalize
        const finalizeRes = await fetch('/api/admin/videos/upload', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId, fileName: file.name, type }),
        });
        const finalizeData = await finalizeRes.json();
        if (!finalizeRes.ok) throw new Error(finalizeData.error || 'Finalization failed');
        onUrl(finalizeData.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={type === 'image' ? 'image/*' : 'video/mp4,video/webm,video/quicktime,video/x-matroska,audio/*,.m3u8'}
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors disabled:opacity-50 min-w-[120px] justify-center"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progress > 0 ? `${progress}%` : '...'}</span>
            </div>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload {type}</span>
            </>
          )}
        </button>
        {error && <span className="text-red-400 text-xs mt-1 block max-w-[200px] truncate" title={error}>{error}</span>}
      </div>
      {loading && progress > 0 && (
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
          <div
            className="bg-red-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
