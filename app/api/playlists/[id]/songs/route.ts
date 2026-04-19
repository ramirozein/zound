import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db as prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId } = await params;
  const { songId } = await req.json();

  if (!songId) {
    return NextResponse.json({ error: "songId is required" }, { status: 400 });
  }

  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, userId: session.userId },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    await prisma.playlistSong.create({
      data: { playlistId, songId },
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Song already in playlist" }, { status: 409 });
    }
    console.error("Error adding song to playlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId } = await params;
  const { songId } = await req.json();

  if (!songId) {
    return NextResponse.json({ error: "songId is required" }, { status: 400 });
  }

  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, userId: session.userId },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  await prisma.playlistSong.delete({
    where: { playlistId_songId: { playlistId, songId } },
  });

  return NextResponse.json({ success: true });
}
