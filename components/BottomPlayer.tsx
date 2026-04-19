"use client";

import React, { useRef, useEffect } from "react";
import {
  MdPlayCircleFilled, MdPauseCircleFilled,
  MdSkipNext, MdSkipPrevious,
  MdShuffle, MdRepeat, MdRepeatOne, MdVolumeUp, MdVolumeOff
} from "react-icons/md";
import { usePlayerStore } from "@/store/usePlayerStore";
import { proxyCoverUrl } from "@/lib/gcs";

export function BottomPlayer() {
  const {
    currentSong, isPlaying, volume, currentTime, duration, queue, queueIndex,
    shuffle, repeat,
    setCurrentTime, setDuration, setVolume, togglePlay,
    toggleShuffle, toggleRepeat, playNext, playPrevious,
  } = usePlayerStore();
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle play/pause sync
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  // Handle volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const handleEnded = () => {
    if (repeat === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => console.error("Replay failed:", err));
      return;
    }
    playNext();
  };

  const handlePrevious = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    playPrevious();
  };

  const canNext =
    queue.length > 1 && (queueIndex < queue.length - 1 || repeat === "all" || shuffle);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <div className="h-16 md:h-20 mx-2 md:mx-0 mb-2 md:mb-0 bg-gradient-to-r from-zinc-800/95 to-zinc-900/95 md:bg-black/95 md:bg-none rounded-xl md:rounded-none md:border-t border-white/10 flex items-center justify-between px-3 md:px-4 relative z-40 animate-slide-up-player shadow-2xl md:shadow-[0_-10px_30px_rgba(0,0,0,0.5)] overflow-hidden">

      {/* Mobile Progress Bar (Absolute Bottom Edge) */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/10 md:hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-linear"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      {/* Hidden audio element */}
      {currentSong.audioUrl && (
        <audio
          ref={audioRef}
          src={`/api/stream?url=${encodeURIComponent(currentSong.audioUrl)}`}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Current Track Info */}
      <div className="flex items-center gap-3 w-full md:w-1/3 flex-1 min-w-0 pr-2">
        {currentSong.coverUrl ? (
          <img
            src={proxyCoverUrl(currentSong.coverUrl)}
            alt={currentSong.title}
            className="w-11 h-11 md:w-14 md:h-14 rounded-md shadow-md md:shadow-lg object-cover flex-shrink-0"
            decoding="async"
          />
        ) : (
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-md shadow-md md:shadow-lg bg-zinc-700 flex-shrink-0" />
        )}
        <div className="flex flex-col flex-1 min-w-0 py-1">
          <span className="text-white text-sm font-semibold truncate">{currentSong.title}</span>
          <span className="text-zinc-400 text-xs truncate">{currentSong.artist}</span>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
        <button
          onClick={toggleShuffle}
          className="hidden min-[380px]:flex w-9 h-9 items-center justify-center rounded-full active:bg-white/10 transition-colors"
          aria-label="Aleatorio"
          aria-pressed={shuffle}
        >
          <MdShuffle className={`text-[18px] ${shuffle ? "text-primary" : "text-zinc-400"}`} />
        </button>
        <button
          onClick={handlePrevious}
          disabled={!currentSong}
          className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-100 disabled:opacity-40 active:bg-white/10 transition-colors"
          aria-label="Anterior"
        >
          <MdSkipPrevious className="text-[26px]" />
        </button>
        <button
          onClick={togglePlay}
          className="w-11 h-11 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Reproducir o pausar"
        >
          {isPlaying ? (
            <MdPauseCircleFilled className="text-[40px] text-white" />
          ) : (
            <MdPlayCircleFilled className="text-[40px] text-white" />
          )}
        </button>
        <button
          onClick={playNext}
          disabled={!canNext}
          className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-100 disabled:opacity-40 active:bg-white/10 transition-colors"
          aria-label="Siguiente"
        >
          <MdSkipNext className="text-[26px]" />
        </button>
        <button
          onClick={toggleRepeat}
          className="hidden min-[380px]:flex w-9 h-9 items-center justify-center rounded-full active:bg-white/10 transition-colors"
          aria-label={repeat === "one" ? "Repetir canción" : repeat === "all" ? "Repetir lista" : "Repetir"}
          aria-pressed={repeat !== "off"}
        >
          {repeat === "one" ? (
            <MdRepeatOne className="text-[18px] text-primary" />
          ) : (
            <MdRepeat className={`text-[18px] ${repeat === "all" ? "text-primary" : "text-zinc-400"}`} />
          )}
        </button>
      </div>

      {/* Desktop Controls */}
      <div className="hidden md:flex flex-col items-center max-w-[40%] w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className="p-2 transition-colors"
            aria-label="Aleatorio"
            aria-pressed={shuffle}
          >
            <MdShuffle className={`text-xl hidden sm:block transition-colors ${shuffle ? "text-primary" : "text-zinc-400 hover:text-white"}`} />
          </button>
          <button
            onClick={handlePrevious}
            disabled={!currentSong}
            className="p-2 disabled:opacity-50 transition-opacity flex items-center justify-center"
            aria-label="Anterior"
          >
             <MdSkipPrevious className="text-2xl text-zinc-400 hover:text-white" />
          </button>
          <button onClick={togglePlay} className="hover:scale-105 transition-transform p-1" aria-label="Reproducir o pausar">
            {isPlaying ? (
              <MdPauseCircleFilled className="text-4xl text-white" />
            ) : (
              <MdPlayCircleFilled className="text-4xl text-white" />
            )}
          </button>
          <button
            onClick={playNext}
            disabled={!canNext}
            className="p-2 disabled:opacity-50 transition-opacity flex items-center justify-center"
            aria-label="Siguiente"
          >
            <MdSkipNext className="text-2xl text-zinc-400 hover:text-white" />
          </button>
          <button
            onClick={toggleRepeat}
            className="p-2 transition-colors relative"
            aria-label={repeat === "one" ? "Repetir canción" : repeat === "all" ? "Repetir lista" : "Repetir"}
            aria-pressed={repeat !== "off"}
          >
            {repeat === "one" ? (
              <MdRepeatOne className="text-xl text-primary hidden sm:block" />
            ) : (
              <MdRepeat className={`text-xl hidden sm:block transition-colors ${repeat === "all" ? "text-primary" : "text-zinc-400 hover:text-white"}`} />
            )}
          </button>
        </div>
        
        {/* Scrubber Area */}
        <div className="w-full flex items-center gap-2 mt-1">
          <span className="text-[11px] text-zinc-400 min-w-[30px] text-right">{formatTime(currentTime)}</span>
          <input 
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 slider-range"
            style={{ backgroundSize: `${duration ? (currentTime / duration) * 100 : 0}% 100%` }}
          />
          <span className="text-[11px] text-zinc-400 min-w-[30px]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="w-1/3 flex items-center justify-end gap-3 hidden md:flex">
        <button 
          onClick={() => setVolume(volume === 0 ? 50 : 0)} 
          className="p-2"
          aria-label={volume === 0 ? "Activar sonido" : "Silenciar"}
        >
          {volume === 0 ? (
             <MdVolumeOff className="text-xl text-zinc-400 hover:text-white" />
          ) : (
             <MdVolumeUp className="text-xl text-zinc-400 hover:text-white" />
          )}
        </button>
        <input 
          type="range"
          min="0"
          max={100}
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 slider-range"
          style={{ backgroundSize: `${volume}% 100%` }}
        />
      </div>
    </div>
  );
}
