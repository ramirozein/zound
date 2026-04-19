"use client";

import React, { useState } from "react";
import { MdPlayCircleFilled, MdMoreVert, MdMusicNote } from "react-icons/md";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";
import { proxyCoverUrl } from "@/lib/gcs";

function CoverImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  className: string;
  eager?: boolean;
}) {
  const resolved = proxyCoverUrl(src);
  if (!resolved) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900`}>
        <MdMusicNote className="text-white/40 text-3xl" />
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
    />
  );
}

interface AlbumCardProps {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl?: string;
  isSquare?: boolean;
  eager?: boolean;
}

export function AlbumCard({ id, title, artist, coverUrl, audioUrl, isSquare = true, eager = false }: AlbumCardProps) {
  const playSong = usePlayerStore((state) => state.playSong);
  const [modalOpen, setModalOpen] = useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSong({ id, title, artist, coverUrl, audioUrl });
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalOpen(true);
  };

  if (!isSquare) {
    return (
      <>
        <div
          className={`flex items-center gap-4 bg-zinc-800/40 rounded-md overflow-hidden transition-colors flex-1 min-w-[250px] ${
            audioUrl ? "hover:bg-zinc-700/50 cursor-pointer group" : "cursor-default"
          }`}
          onClick={audioUrl ? handlePlayClick : undefined}
        >
          <CoverImage src={coverUrl} alt={title} className="w-16 h-16 object-cover shadow-md" eager={eager} />
          <span className="text-white font-bold text-sm flex-1 truncate">{title}</span>
          
          {audioUrl && (
            <div className="ml-auto mr-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={handleMoreClick} className="p-1 rounded-full hover:bg-white/10 transition-colors" aria-label="Más opciones">
                <MdMoreVert className="text-zinc-300 text-xl" />
              </button>
              <button onClick={handlePlayClick} aria-label="Reproducir">
                <MdPlayCircleFilled className="text-primary text-4xl hover:scale-105 transition-transform" />
              </button>
            </div>
          )}
        </div>
        <AddToPlaylistModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          songId={id}
          songTitle={title}
        />
      </>
    );
  }

  return (
    <>
      <div 
        className={`bg-surface p-4 rounded-lg transition-colors flex-shrink-0 w-40 sm:w-48 ${
          audioUrl ? "hover:bg-zinc-800 cursor-pointer group" : "cursor-default"
        }`}
        onClick={audioUrl ? handlePlayClick : undefined}
      >
        <div className="relative mb-4 w-full aspect-square shadow-lg">
          <CoverImage src={coverUrl} alt={title} className="w-full h-full object-cover rounded-md" eager={eager} />
          {audioUrl && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
              <button
                onClick={handleMoreClick}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors shadow"
                aria-label="Más opciones"
              >
                <MdMoreVert className="text-white text-lg" />
              </button>
              <button onClick={handlePlayClick} className="shadow-xl bg-black rounded-full" aria-label="Reproducir">
                <MdPlayCircleFilled className="text-primary text-[50px] drop-shadow-lg block hover:text-primary-hover hover:scale-105 transition-transform" />
              </button>
            </div>
          )}
        </div>
        <h3 className="text-white font-bold text-sm sm:text-base truncate">{title}</h3>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1 truncate">{artist}</p>
      </div>
      <AddToPlaylistModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        songId={id}
        songTitle={title}
      />
    </>
  );
}
