import { Storage, type Bucket } from "@google-cloud/storage";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { parseBuffer } from "music-metadata";
import { createHash } from "crypto";
import "dotenv/config";

const BUCKET_NAME = process.env.GCS_BUCKET ?? "zound-media-bucket";
const AUDIO_PREFIX = process.env.GCS_AUDIO_PREFIX ?? "protected/audio/mp3/";
const IMAGE_PREFIX = process.env.GCS_IMAGE_PREFIX ?? "protected/images/";
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const AUDIO_EXT = ".mp3";
const DURATION_PROBE_BYTES = 2 * 1024 * 1024;

type ParsedAudio = { artist: string; album: string | null; title: string };

function getStorage(): Storage {
  const raw = process.env.GOOGLE_KEY;
  if (!raw) throw new Error("Missing GOOGLE_KEY");
  const creds = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  return new Storage({
    projectId: creds.project_id,
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
  });
}

function publicUrl(bucket: string, path: string): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://storage.googleapis.com/${bucket}/${encoded}`;
}

function parseAudioPath(fullPath: string, prefix: string): ParsedAudio | null {
  if (!fullPath.startsWith(prefix)) return null;
  if (!fullPath.toLowerCase().endsWith(AUDIO_EXT)) return null;
  const rel = fullPath.slice(prefix.length);
  const parts = rel.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const fileName = parts.pop() as string;
  const title = fileName.slice(0, -AUDIO_EXT.length).trim();
  if (!title) return null;
  if (parts.length === 2) return { artist: parts[0], album: parts[1], title };
  if (parts.length === 1) return { artist: parts[0], album: null, title };
  return null;
}

async function fetchDurationSec(bucket: Bucket, path: string): Promise<number> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = bucket.file(path).createReadStream({
      start: 0,
      end: DURATION_PROBE_BYTES - 1,
    });
    stream.on("data", (c: Buffer) => chunks.push(c));
    stream.on("error", reject);
    stream.on("end", () => resolve());
  });
  const meta = await parseBuffer(
    Buffer.concat(chunks),
    { mimeType: "audio/mpeg" },
    { duration: true },
  );
  return Math.round(meta.format.duration ?? 0);
}

function pickCover(key: string, covers: string[]): string | null {
  if (!covers.length) return null;
  const h = createHash("sha1").update(key).digest();
  return covers[h.readUInt32BE(0) % covers.length];
}

async function listPaths(bucket: Bucket, prefix: string): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix });
  return files.map((f) => f.name);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const storage = getStorage();
  const bucket = storage.bucket(BUCKET_NAME);

  console.log(
    `[sync-gcs] bucket=${BUCKET_NAME} audio=${AUDIO_PREFIX} images=${IMAGE_PREFIX}`,
  );

  const [audioPaths, imagePaths] = await Promise.all([
    listPaths(bucket, AUDIO_PREFIX),
    listPaths(bucket, IMAGE_PREFIX),
  ]);

  const coverUrls = imagePaths
    .filter((p) => IMAGE_EXTS.some((ext) => p.toLowerCase().endsWith(ext)))
    .map((p) => publicUrl(BUCKET_NAME, p));

  console.log(
    `[sync-gcs] discovered audio=${audioPaths.length} images=${coverUrls.length}`,
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const path of audioPaths) {
    const parsed = parseAudioPath(path, AUDIO_PREFIX);
    if (!parsed) {
      skipped++;
      console.warn(`[sync-gcs] skip (unrecognized path): ${path}`);
      continue;
    }

    const audioUrl = publicUrl(BUCKET_NAME, path);

    let duration = 0;
    try {
      duration = await fetchDurationSec(bucket, path);
    } catch (err) {
      console.warn(
        `[sync-gcs] duration probe failed for ${path}: ${(err as Error).message}`,
      );
    }

    try {
      let artist = await prisma.artist.findFirst({
        where: { name: parsed.artist },
      });
      if (!artist) {
        artist = await prisma.artist.create({
          data: {
            name: parsed.artist,
            imageUrl: pickCover(`artist:${parsed.artist}`, coverUrls),
          },
        });
      }

      let albumId: string | null = null;
      if (parsed.album) {
        let album = await prisma.album.findFirst({
          where: { title: parsed.album, artistId: artist.id },
        });
        if (!album) {
          album = await prisma.album.create({
            data: {
              title: parsed.album,
              artistId: artist.id,
              releaseAt: new Date(),
              coverUrl: pickCover(
                `album:${artist.id}:${parsed.album}`,
                coverUrls,
              ),
            },
          });
        }
        albumId = album.id;
      }

      const existing = await prisma.song.findFirst({ where: { audioUrl } });
      if (existing) {
        const stale =
          existing.title !== parsed.title ||
          existing.duration !== duration ||
          existing.artistId !== artist.id ||
          existing.albumId !== albumId;
        if (stale) {
          await prisma.song.update({
            where: { id: existing.id },
            data: {
              title: parsed.title,
              duration,
              artistId: artist.id,
              albumId,
            },
          });
          updated++;
        }
      } else {
        await prisma.song.create({
          data: {
            title: parsed.title,
            audioUrl,
            duration,
            artistId: artist.id,
            albumId,
          },
        });
        created++;
      }
    } catch (err) {
      failed++;
      console.error(
        `[sync-gcs] upsert failed for ${path}: ${(err as Error).message}`,
      );
    }
  }

  console.log(
    `[sync-gcs] done. created=${created} updated=${updated} skipped=${skipped} failed=${failed} total=${audioPaths.length}`,
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
