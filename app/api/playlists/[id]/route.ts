import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db as prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  return NextResponse.json(playlist);
}
