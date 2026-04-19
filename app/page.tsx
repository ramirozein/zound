import React from "react";
import { AlbumCard } from "@/components/AlbumCard";
import { getSession } from "@/lib/session";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RecommendedShelf } from "@/components/RecommendedShelf";

const MOCK_IMAGES = {
  synth: "/api/image?path=C:/Users/ramir/.gemini/antigravity/brain/70cf9808-0d29-4211-adb7-9be39538ccb7/synthwave_album_cover_1776444696678.png",
  lofi: "/api/image?path=C:/Users/ramir/.gemini/antigravity/brain/70cf9808-0d29-4211-adb7-9be39538ccb7/lofi_beats_cover_1776444709709.png",
  techno: "/api/image?path=C:/Users/ramir/.gemini/antigravity/brain/70cf9808-0d29-4211-adb7-9be39538ccb7/techno_mix_cover_1776444723262.png",
  default: "/api/image?path=C:/Users/ramir/.gemini/antigravity/brain/70cf9808-0d29-4211-adb7-9be39538ccb7/synthwave_album_cover_1776444696678.png"
};

export default async function Home() {
  const session = await getSession();
  const displayUsername = session?.username || "Guest";

  return (
    <div className="min-h-full">
      <DashboardHeader username={displayUsername} />

      <div className="p-6 pb-24 md:pb-8">
        {/* Quick Play (Recents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <AlbumCard id="q1" title="Synthwave Mix" artist="Zound Focus" coverUrl={MOCK_IMAGES.synth} isSquare={false} />
          <AlbumCard id="q2" title="Lofi Evening" artist="Zound Chill" coverUrl={MOCK_IMAGES.lofi} isSquare={false} />
          <AlbumCard id="q3" title="Techno Bunker" artist="Zound Rave" coverUrl={MOCK_IMAGES.techno} isSquare={false} />
          <AlbumCard id="q4" title="Top Hits Global" artist="Zound Charts" coverUrl={MOCK_IMAGES.default} isSquare={false} />
          <AlbumCard id="q5" title="Liked Songs" artist={`${session?.username ? "Your" : ""} 345 songs`} coverUrl={MOCK_IMAGES.default} isSquare={false} />
          <AlbumCard id="q6" title="Your Daily Mix 1" artist="Made for You" coverUrl={MOCK_IMAGES.default} isSquare={false} />
        </div>

        {/* AI Recommendations */}
        <RecommendedShelf />

        {/* Featured Section */}
        <h2 className="text-xl font-bold text-white mb-4 hover:underline cursor-pointer inline-block">Made for You</h2>
        <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar -mx-6 px-6">
          <AlbumCard id="s1" title="Daily Mix 1" artist="Synth, Cyberpunk, 80s" coverUrl={MOCK_IMAGES.synth} />
          <AlbumCard id="s2" title="Daily Mix 2" artist="Lofi, Chillhop, Jazz" coverUrl={MOCK_IMAGES.lofi} />
          <AlbumCard id="s3" title="Daily Mix 3" artist="Techno, House, Trance" coverUrl={MOCK_IMAGES.techno} />
          <AlbumCard id="s4" title="Discover Weekly" artist="New music tailored to you" coverUrl={MOCK_IMAGES.default} />
          <AlbumCard id="s5" title="Release Radar" artist="Catch up on the latest" coverUrl={MOCK_IMAGES.default} />
        </div>

        {/* Recently Played */}
        <h2 className="text-xl font-bold text-white mt-8 mb-4 hover:underline cursor-pointer inline-block">Recently played</h2>
        <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar -mx-6 px-6">
          <AlbumCard id="r1" title="Lofi Chill" artist="Various Artists" coverUrl={MOCK_IMAGES.lofi} />
          <AlbumCard id="r2" title="Techno Bunker" artist="Various Artists" coverUrl={MOCK_IMAGES.techno} />
          <AlbumCard id="r3" title="Synthwave" artist="Various Artists" coverUrl={MOCK_IMAGES.synth} />
        </div>
      </div>
    </div>
  );
}
