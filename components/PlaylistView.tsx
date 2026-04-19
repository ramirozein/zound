"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MdPlayCircleFilled, MdPauseCircleFilled,
  MdShuffle, MdMoreVert, MdMusicNote, MdDeleteOutline,
  MdOutlineLibraryAdd,
} from "react-icons/md";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";

interface Album {
  id: string;
  title: string;
  coverUrl: string | null;
}

interface Artist {
  id: string;
  name: string;
}

interface Song {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  artist: Artist;
  album: Album | null;
}

interface SongEntry {
  addedAt: string;
  song: Song;
}

export interface PlaylistData {
  id: string;
  name: string;
  coverUrl: string | null;
  songs: SongEntry[];
  [key: string]: unknown;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

interface SongMenuProps {
  playlistId: string;
  song: Song;
  onRemoved: (songId: string) => void;
}

function SongMenu({ playlistId, song, onRemoved }: SongMenuProps) {
  const [open, setOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleRemove = async () => {
    setOpen(false);
    await fetch(`/api/playlists/${playlistId}/songs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId: song.id }),
    });
    onRemoved(song.id);
  };

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
        >
          <MdMoreVert className="text-xl" />
        </button>

        {open && (
          <div className="absolute right-0 top-8 z-50 bg-[#282828] border border-white/10 rounded-lg shadow-2xl w-52 py-1 overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); setAddModalOpen(true); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/10 transition-colors text-left"
            >
              <MdOutlineLibraryAdd className="text-lg flex-shrink-0" />
              Agregar a otra playlist
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors text-left"
            >
              <MdDeleteOutline className="text-lg flex-shrink-0" />
              Eliminar de la playlist
            </button>
          </div>
        )}
      </div>

      <AddToPlaylistModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        songId={song.id}
        songTitle={song.title}
      />
    </>
  );
}

interface SongRowProps {
  entry: SongEntry;
  index: number;
  playlistId: string;
  onRemoved: (songId: string) => void;
}

function SongRow({ entry, index, playlistId, onRemoved }: SongRowProps) {
  const { song } = entry;
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayerStore();
  const [hovered, setHovered] = useState(false);

  const isActive = currentSong?.id === song.id;
  const coverUrl = song.album?.coverUrl ?? "";

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      togglePlay();
    } else {
      playSong({
        id: song.id,
        title: song.title,
        artist: song.artist.name,
        coverUrl,
        audioUrl: song.audioUrl,
      });
    }
  };

  return (
    <div
      className={`grid grid-cols-[2rem_1fr_auto_2.5rem] md:grid-cols-[2rem_1fr_auto_2.5rem] items-center gap-4 px-4 py-2 rounded-md group transition-colors cursor-default ${
        isActive ? "bg-white/10" : "hover:bg-white/5"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Index / Play icon */}
      <div className="flex items-center justify-center w-8">
        {hovered || isActive ? (
          <button onClick={handlePlay} className="text-white">
            {isActive && isPlaying ? (
              <MdPauseCircleFilled className="text-2xl text-primary" />
            ) : (
              <MdPlayCircleFilled className="text-2xl" />
            )}
          </button>
        ) : (
          <span className={`text-sm tabular-nums ${isActive ? "text-primary" : "text-zinc-400"}`}>
            {index + 1}
          </span>
        )}
      </div>

      {/* Title + Artist + Cover */}
      <div className="flex items-center gap-3 min-w-0" onClick={handlePlay}>
        <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
          {coverUrl ? (
            <img src={coverUrl} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MdMusicNote className="text-zinc-500 text-xl" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-white"}`}>
            {song.title}
          </p>
          <p className="text-xs text-zinc-400 truncate">{song.artist.name}</p>
        </div>
      </div>

      {/* Duration */}
      <span className="text-sm text-zinc-400 tabular-nums">{formatDuration(song.duration)}</span>

      {/* Options */}
      <div className={`flex justify-end transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}>
        <SongMenu playlistId={playlistId} song={song} onRemoved={onRemoved} />
      </div>
    </div>
  );
}

export function PlaylistView({ playlist: initial }: { playlist: PlaylistData }) {
  const [songs, setSongs] = useState<SongEntry[]>(initial.songs);
  const { playSong } = usePlayerStore();

  const totalDuration = songs.reduce((acc, e) => acc + e.song.duration, 0);

  const handleRemoved = (songId: string) => {
    setSongs((prev) => prev.filter((e) => e.song.id !== songId));
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    const first = songs[0].song;
    playSong({
      id: first.id,
      title: first.title,
      artist: first.artist.name,
      coverUrl: first.album?.coverUrl ?? "",
      audioUrl: first.audioUrl,
    });
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-b from-violet-900/70 via-zinc-900/60 to-transparent pt-16 pb-6 px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Cover */}
          <div className="w-44 h-44 flex-shrink-0 rounded-lg shadow-2xl overflow-hidden bg-zinc-800">
            {initial.coverUrl ? (
              <img src={initial.coverUrl} alt={initial.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-800 to-indigo-900">
                <MdMusicNote className="text-white/50 text-7xl" />
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Playlist</span>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">{initial.name}</h1>
            <p className="text-sm text-zinc-400">
              {songs.length} {songs.length === 1 ? "canción" : "canciones"}
              {totalDuration > 0 && ` · ${formatTotal(totalDuration)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          disabled={songs.length === 0}
          className="disabled:opacity-40 transition-transform hover:scale-105"
        >
          <MdPlayCircleFilled className="text-primary text-[64px] drop-shadow-lg" />
        </button>
        <button className="p-2 text-zinc-400 hover:text-white transition-colors">
          <MdShuffle className="text-2xl" />
        </button>
      </div>

      {/* Song list */}
      <div className="px-4 pb-32 md:pb-8 flex-1">
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
            <MdMusicNote className="text-6xl" />
            <p className="font-semibold text-lg">Esta playlist está vacía</p>
            <p className="text-sm">Agrega canciones para empezar.</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_auto_2.5rem] gap-4 px-4 pb-2 border-b border-white/10 mb-2">
              <span className="text-xs text-zinc-500 text-center">#</span>
              <span className="text-xs text-zinc-500">Título</span>
              <span className="text-xs text-zinc-500">Duración</span>
              <span />
            </div>

            {songs.map((entry, i) => (
              <SongRow
                key={entry.song.id}
                entry={entry}
                index={i}
                playlistId={initial.id}
                onRemoved={handleRemoved}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
