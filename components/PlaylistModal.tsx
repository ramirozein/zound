"use client";

import { useTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdOutlineLibraryMusic } from "react-icons/md";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PlaylistModal({ isOpen, onClose, onSuccess }: PlaylistModalProps) {
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    startTransition(async () => {
      try {
        const res = await fetch("/api/playlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        
        if (res.ok) {
          setName("");
          onSuccess();
          onClose();
        } else {
          console.error("Failed to create playlist");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative bg-[#121212]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <MdOutlineLibraryMusic className="text-primary text-4xl" />
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-3">Nueva Playlist</h2>
        <p className="text-zinc-400 text-sm text-center mb-6 px-2 leading-relaxed">
          Dale un nombre a tu nueva playlist y comienza a guardar tus canciones favoritas.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mi Playlist"
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
            className="w-full py-4 bg-primary hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-black font-bold rounded-full transition-transform flex justify-center items-center gap-2"
          >
            {isPending ? "Creando..." : "Crear Playlist"}
          </button>
          <button 
            onClick={onClose}
            disabled={isPending}
            className="w-full py-4 bg-transparent hover:text-white text-zinc-400 font-bold rounded-full transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
