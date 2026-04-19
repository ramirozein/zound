"use client";

import React, { useRef, useEffect } from "react";
import { 
  MdPlayCircleFilled, MdPauseCircleFilled, 
  MdSkipNext, MdSkipPrevious,
  MdShuffle, MdRepeat, MdVolumeUp, MdVolumeOff
} from "react-icons/md";
import { usePlayerStore } from "@/store/usePlayerStore";

export function BottomPlayer() {
  const { 
    currentSong, isPlaying, volume, currentTime, duration,
    setPlaying, setCurrentTime, setDuration, setVolume, togglePlay 
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

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <div className="h-20 w-full bg-black/95 border-t border-border flex items-center justify-between px-4 sticky bottom-0 z-50 md:z-auto mb-16 md:mb-0 animate-slide-up-player shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      
      {/* Hidden audio element */}
      {currentSong.audioUrl && (
        <audio
          ref={audioRef}
          src={`/api/stream?url=${encodeURIComponent(currentSong.audioUrl)}`}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setPlaying(false)}
        />
      )}

      {/* Current Track Info */}
      <div className="flex items-center gap-3 w-1/3">
        <img 
          src={currentSong.coverUrl} 
          alt={currentSong.title} 
          className="w-14 h-14 rounded shadow-lg object-cover"
        />
        <div className="flex flex-col hidden sm:flex truncate">
          <span className="text-white text-sm font-semibold hover:underline cursor-pointer truncate">{currentSong.title}</span>
          <span className="text-zinc-400 text-xs hover:underline cursor-pointer truncate">{currentSong.artist}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center max-w-[40%] w-full">
        <div className="flex items-center gap-6">
          <MdShuffle className="text-xl text-zinc-400 hover:text-white cursor-pointer hidden sm:block" />
          <MdSkipPrevious className="text-2xl text-zinc-400 hover:text-white cursor-pointer" />
          <button onClick={togglePlay} className="hover:scale-105 transition-transform">
            {isPlaying ? (
              <MdPauseCircleFilled className="text-4xl text-white" />
            ) : (
              <MdPlayCircleFilled className="text-4xl text-white" />
            )}
          </button>
          <MdSkipNext className="text-2xl text-zinc-400 hover:text-white cursor-pointer" />
          <MdRepeat className="text-xl text-zinc-400 hover:text-white cursor-pointer hidden sm:block" />
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
        {volume === 0 ? (
           <MdVolumeOff className="text-xl text-zinc-400 hover:text-white cursor-pointer" onClick={() => setVolume(50)} />
        ) : (
           <MdVolumeUp className="text-xl text-zinc-400 hover:text-white cursor-pointer" onClick={() => setVolume(0)} />
        )}
        <input 
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 slider-range"
          style={{ backgroundSize: `${volume}% 100%` }}
        />
      </div>
    </div>
  );
}
