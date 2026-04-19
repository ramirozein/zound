"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdOutlineLibraryAdd, MdCheck, MdClose } from "react-icons/md";

interface Playlist {
  id: string;
  name: string;
  coverUrl: string | null;
}

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  songTitle: string;
}

export function AddToPlaylistModal({ isOpen, onClose, songId, songTitle }: AddToPlaylistModalProps) {
  const [mounted, setMounted] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setAddedIds(new Set());
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((data) => setPlaylists(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleAdd = async (playlistId: string) => {
    if (addedIds.has(playlistId) || pendingId === playlistId) return;
    setPendingId(playlistId);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      if (res.ok || res.status === 409) {
        setAddedIds((prev) => new Set(prev).add(playlistId));
      }
    } catch (error) {
      console.error("Error adding song to playlist:", error);
    } finally {
      setPendingId(null);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#121212]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <MdClose className="text-xl" />
        </button>

        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <MdOutlineLibraryAdd className="text-primary text-3xl" />
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-1">Agregar a playlist</h2>
        <p className="text-zinc-400 text-xs text-center mb-5 truncate px-4">{songTitle}</p>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-zinc-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No tienes playlists todavía.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {playlists.map((pl) => {
              const added = addedIds.has(pl.id);
              const pending = pendingId === pl.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => handleAdd(pl.id)}
                  disabled={added || pending}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl bg-zinc-800/40 hover:bg-zinc-700/50 disabled:hover:bg-zinc-800/40 transition-colors text-left"
                >
                  {pl.coverUrl ? (
                    <img React-src={pl.coverUrl} src={`/api/cover?url=${encodeURIComponent(pl.coverUrl)}`} alt={pl.name} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-zinc-700 flex-shrink-0" />
                  )}
                  <span className="text-white text-sm font-medium truncate flex-1">{pl.name}</span>
                  {added && <MdCheck className="text-primary text-lg flex-shrink-0" />}
                  {pending && <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
