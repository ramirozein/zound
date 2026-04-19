import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db as prisma } from "@/lib/db";
import { PlaylistView } from "@/components/PlaylistView";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const { id } = await params;

  const playlist = await prisma.playlist.findFirst({
    where: { id, userId: session.userId },
    include: {
      songs: {
        include: {
          song: {
            include: { artist: true, album: true },
          },
        },
        orderBy: { addedAt: "asc" },
      },
    },
  });

  if (!playlist) notFound();

  const serialized = {
    ...playlist,
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString(),
    songs: playlist.songs.map((entry) => ({
      addedAt: entry.addedAt.toISOString(),
      song: {
        ...entry.song,
        createdAt: entry.song.createdAt.toISOString(),
        updatedAt: entry.song.updatedAt.toISOString(),
        artist: {
          ...entry.song.artist,
          createdAt: entry.song.artist.createdAt.toISOString(),
          updatedAt: entry.song.artist.updatedAt.toISOString(),
        },
        album: entry.song.album
          ? {
              ...entry.song.album,
              releaseAt: entry.song.album.releaseAt.toISOString(),
              createdAt: entry.song.album.createdAt.toISOString(),
              updatedAt: entry.song.album.updatedAt.toISOString(),
            }
          : null,
      },
    })),
  };

  return <PlaylistView playlist={serialized} />;
}
