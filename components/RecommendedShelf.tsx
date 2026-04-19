"use client";

import React, { useEffect, useState } from "react";
import { AlbumCard } from "./AlbumCard";

interface Recommendation {
  id: string;
  title: string;
  artist: { name: string };
  audioUrl: string;
  album: { coverUrl: string } | null;
}

export function RecommendedShelf() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch("/api/recommendations");
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecs();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Recomendado por IA</h2>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[160px] max-w-[200px] flex-1">
              <div className="bg-zinc-800/50 aspect-square rounded-md mb-4 animate-pulse"></div>
              <div className="h-4 bg-zinc-800/50 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-zinc-800/50 rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null; // Return null if no recommendations or fallback
  }

  return (
    <div className="mt-8 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-white hover:underline cursor-pointer inline-block">
          Sugerencias para ti (IA)
        </h2>
        <span className="text-xs bg-primary text-black px-2 py-0.5 font-bold rounded-full">New</span>
      </div>
      <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar -mx-6 px-6">
        {recommendations.map((rec) => (
          <AlbumCard 
            key={rec.id} 
            id={rec.id} 
            title={rec.title} 
            artist={rec.artist.name} 
            coverUrl={rec.album?.coverUrl ?? ""}
            audioUrl={rec.audioUrl}
          />
        ))}
      </div>
    </div>
  );
}
