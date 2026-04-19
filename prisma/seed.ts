import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with test song...');

  // Create an artist
  const artist = await prisma.artist.create({
    data: {
      name: 'NCS Release',
      bio: 'NoCopyrightSounds is a copyright free / stream safe record label.',
    },
  });

  // Create an album
  const album = await prisma.album.create({
    data: {
      title: 'waera - harinezumi',
      artistId: artist.id,
      releaseAt: new Date(),
    },
  });

  // Create a song
  const song = await prisma.song.create({
    data: {
      title: 'harinezumi',
      audioUrl: 'https://storage.googleapis.com/zound-media-bucket/protected/audio/mp3/waera%20-%20harinezumi%20%5BNCS%20Release%5D.mp3',
      duration: 180,
      artistId: artist.id,
      albumId: album.id,
    },
  });

  console.log('Database seeded securely.', song.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
