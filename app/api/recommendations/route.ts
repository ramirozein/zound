import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db as prisma } from "@/lib/db";
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get user's liked songs to determine taste
    const likedSongs = await prisma.like.findMany({
      where: { userId: session.userId },
      include: { song: { include: { artist: true } } },
      orderBy: { likedAt: "desc" },
      take: 10,
    });

    const tasteDescription = likedSongs.length > 0
      ? likedSongs.map(l => `${l.song.title} by ${l.song.artist.name}`).join(", ")
      : "No liked songs yet. Just looking for some good general music.";

    // 2. Get available songs from the database to recommend from
    const availableSongs = await prisma.song.findMany({
      include: { artist: true },
      take: 50, // Limit for prompt size
    });

    if (availableSongs.length === 0) {
      return NextResponse.json([]);
    }

    const catalogStr = availableSongs
      .map(s => `ID: ${s.id} | Title: ${s.title} | Artist: ${s.artist.name}`)
      .join("\n");

    // 3. Ask OpenAI to pick recommendations
    const prompt = `
You are an expert music recommendation AI.
The user has the following music taste based on their recently liked songs:
[${tasteDescription}]

Here is the catalog of available songs in the database:
${catalogStr}

Please recommend exactly 5 songs from the catalog (or however many are available if less than 5) that the user would enjoy. 
Format your response as a valid JSON array of song IDs ONLY. For example: ["id1", "id2"]
Do not include markdown blocks like \`\`\`json, just return the raw array.
`;

    let recommendedIds: string[] = [];
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini for speed/cost
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = completion.choices[0].message.content?.trim() || "[]";
      
      // Clean up markdown if AI accidentally included it
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      recommendedIds = JSON.parse(cleanedText);
    } catch (aiError) {
      console.error("OpenAI error, falling back to random:", aiError);
      // Fallback: pick randomly
      recommendedIds = availableSongs.sort(() => 0.5 - Math.random()).slice(0, 5).map(s => s.id);
    }

    // 4. Fetch the selected songs
    const recommendations = await prisma.song.findMany({
      where: { id: { in: recommendedIds } },
      include: { artist: true },
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
