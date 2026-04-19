import React from "react";
import { unstable_cache } from "next/cache";
import { AlbumCard } from "@/components/AlbumCard";
import { getSession } from "@/lib/session";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RecommendedShelf } from "@/components/RecommendedShelf";
import { db as prisma } from "@/lib/db";
import { MdLibraryMusic } from "react-icons/md";

const getCatalog = unstable_cache(
  async () => {
    const [albums, artists, songs] = await Promise.all([
      prisma.album.findMany({
        include: { artist: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.artist.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.song.findMany({
        include: { artist: true, album: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);
    return { albums, artists, songs };
  },
  ["home-catalog"],
  { tags: ["catalog"], revalidate: 600 },
);

export default async function Home() {
  const session = await getSession();
  const displayUsername = session?.username || "Invitado";
  const { albums, artists, songs } = await getCatalog();

  const quickPlay = albums.slice(0, 6);
  const hasCatalog = albums.length > 0 || artists.length > 0 || songs.length > 0;

  return (
    <div className="min-h-full">
      <DashboardHeader username={displayUsername} />

      <div className="p-6 pb-24 md:pb-8">
        {!hasCatalog && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-3">
            <MdLibraryMusic className="text-6xl" />
            <p className="font-semibold text-lg text-zinc-300">Catálogo vacío</p>
            <p className="text-sm">Ejecuta <code className="px-2 py-0.5 bg-zinc-800 rounded">pnpm sync:gcs</code> para cargar contenido desde Google Cloud.</p>
          </div>
        )}

        {quickPlay.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {quickPlay.map((a, i) => (
              <AlbumCard
                key={a.id}
                id={a.id}
                title={a.title}
                artist={a.artist.name}
                coverUrl={a.coverUrl ?? ""}
                isSquare={false}
                eager={i < 3}
              />
            ))}
          </div>
        )}

        <RecommendedShelf />

        {songs.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-white mb-4 hover:underline cursor-pointer inline-block">Canciones nuevas</h2>
            <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar -mx-6 px-6">
              {songs.map((s) => (
                <AlbumCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  artist={s.artist.name}
                  coverUrl={s.album?.coverUrl ?? ""}
                  audioUrl={s.audioUrl}
                />
              ))}
            </div>
          </>
        )}

        {albums.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-white mt-8 mb-4 hover:underline cursor-pointer inline-block">Álbumes</h2>
            <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar -mx-6 px-6">
              {albums.map((a) => (
                <AlbumCard
                  key={a.id}
                  id={a.id}
                  title={a.title}
                  artist={a.artist.name}
                  coverUrl={a.coverUrl ?? ""}
                />
              ))}
            </div>
          </>
        )}

        {artists.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-white mt-8 mb-4 hover:underline cursor-pointer inline-block">Artistas</h2>
            <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar -mx-6 px-6">
              {artists.map((a) => (
                <AlbumCard
                  key={a.id}
                  id={a.id}
                  title={a.name}
                  artist=""
                  coverUrl={a.imageUrl ?? ""}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
