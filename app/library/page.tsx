import React from "react";
import { getSession } from "@/lib/session";
import { db as prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/DashboardHeader";
import Link from "next/link";
import { MdOutlineLibraryMusic, MdMusicNote } from "react-icons/md";

// Note: To match what's used in Sidebar/PlaylistView
// Normally if it's external GCS we use proxyCoverUrl, but Sidebar just passes playlist.coverUrl.
function CoverImage({ src, alt }: { src: string; alt: string }) {
  // Simple check for cover proxying similar to what AlbumCard does.
  // Actually, we can just render the straight src if it's configured to accept it, 
  // or use the proxy pattern if needed. Here we keep it simple like Sidebar.
  const resolvedUrl = src.startsWith("http") && !src.includes("/api/cover")
    ? `/api/cover?url=${encodeURIComponent(src)}`
    : src;
    
  return (
    <img 
      src={resolvedUrl} 
      alt={alt} 
      className="w-full h-full object-cover" 
      loading="lazy" 
      decoding="async"
    />
  );
}

export default async function LibraryPage() {
  const session = await getSession();
  
  if (!session?.userId) {
    return (
      <div className="min-h-full flex flex-col pt-32 items-center">
        <MdOutlineLibraryMusic className="text-6xl text-zinc-500 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Tu Biblioteca</h1>
        <p className="text-zinc-400">Inicia sesión para ver tus playlists.</p>
        <Link href="/login" className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const playlists = await prisma.playlist.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-full">
      <DashboardHeader username={session.username} />
      
      <div className="p-6 pb-24 md:pb-8">
        <h1 className="text-3xl font-bold text-white mb-8">Tu Biblioteca</h1>
        
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <MdMusicNote className="text-6xl mb-4" />
            <p className="font-semibold text-lg text-white mb-1">Aún no tienes playlists</p>
            <p className="text-sm">Crea una nueva presionando el botón "+" en la barra lateral.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {playlists.map((pl) => (
              <Link 
                key={pl.id} 
                href={`/playlist/${pl.id}`}
                className="bg-surface p-4 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group flex flex-col"
              >
                <div className="relative mb-4 w-full aspect-square shadow-lg rounded-md overflow-hidden bg-zinc-800 flex items-center justify-center">
                  {pl.coverUrl ? (
                    <CoverImage src={pl.coverUrl} alt={pl.name} />
                  ) : (
                    <MdMusicNote className="text-white/40 text-4xl" />
                  )}
                </div>
                <h3 className="text-white font-bold text-sm sm:text-base truncate">{pl.name}</h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">Playlist</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
