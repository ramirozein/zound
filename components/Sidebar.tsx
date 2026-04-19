"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MdOutlineHome, MdHome, 
  MdOutlineSearch, MdSearch, 
  MdOutlineLibraryMusic, MdLibraryMusic,
  MdMusicNote
} from "react-icons/md";
import { PlaylistModal } from "./PlaylistModal";

interface SidebarPlaylist {
  id: string;
  name: string;
  coverUrl: string | null;
}

export function Sidebar() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState<SidebarPlaylist[]>([]);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch("/api/playlists");
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const navItems = [
    { label: "Inicio", href: "/", iconOutlined: MdOutlineHome, iconFilled: MdHome },
    { label: "Tu Biblioteca", href: "/library", iconOutlined: MdOutlineLibraryMusic, iconFilled: MdLibraryMusic },
  ];

  return (
    <>
      <aside className="w-64 bg-black flex flex-col h-full hidden md:flex text-zinc-400 p-2 space-y-2">
        {/* Brand */}
        <div className="px-6 py-4 flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <MdHome className="text-black text-xl" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Zound</span>
        </div>

        {/* Navigation */}
        <div className="bg-surface rounded-lg p-2">
          <ul className="space-y-1">
            {navItems.slice(0, 2).map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-md font-bold transition-all duration-200 ${
                      isActive ? "text-white" : "hover:text-white"
                    }`}
                  >
                    {isActive ? (
                      <item.iconFilled className="text-2xl" />
                    ) : (
                      <item.iconOutlined className="text-2xl" />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Library */}
        <div className="bg-surface rounded-lg p-2 flex-1 flex flex-col">
          <div className="mt-2 flex-1 overflow-y-auto px-2 space-y-3 pb-24 hide-scrollbar">
            {playlists.length === 0 ? (
              <div className="px-3 py-4 bg-zinc-800/40 rounded-lg">
                <h4 className="text-white font-bold mb-1">Crea tu primera playlist</h4>
                <p className="text-sm">Es fácil, te ayudaremos</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 bg-white text-black font-bold px-4 py-1.5 rounded-full text-sm hover:scale-105 transition-transform"
                >
                  Crear playlist
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full text-left px-3 py-2 rounded flex items-center gap-3 text-sm font-bold text-white hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center rounded">
                    <span className="text-2xl">+</span>
                  </div>
                  Crear Playlist
                </button>
                {playlists.map((playlist) => (
                  <Link key={playlist.id} href={`/playlist/${playlist.id}`} className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 text-sm font-bold transition-colors ${pathname === `/playlist/${playlist.id}` ? "bg-zinc-800/60 text-white" : "text-zinc-300 hover:bg-zinc-800/40 hover:text-white"}`}>
                    <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center rounded overflow-hidden flex-shrink-0">
                      {playlist.coverUrl ? (
                         <img src={playlist.coverUrl} className="w-full h-full object-cover" alt="cover" />
                      ) : (
                         <MdMusicNote className="text-2xl text-zinc-500" />
                      )}
                    </div>
                    <span className="truncate">{playlist.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
      
      <PlaylistModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchPlaylists}
      />
    </>
  );
}
