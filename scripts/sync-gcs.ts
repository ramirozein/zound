import { Storage, type Bucket } from "@google-cloud/storage";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { parseBuffer } from "music-metadata";
import { createHash } from "crypto";
import "dotenv/config";

const BUCKET_NAME = process.env.GCS_BUCKET ?? "zound-media-bucket";
const AUDIO_PREFIX = process.env.GCS_AUDIO_PREFIX ?? "protected/audio/mp3/";
const ARTIST_IMAGE_PREFIX = process.env.GCS_ARTIST_IMAGE_PREFIX ?? "public/artists/";
const ALBUM_COVER_PREFIX = process.env.GCS_ALBUM_COVER_PREFIX ?? "public/covers/";
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const AUDIO_EXT = ".mp3";
const DURATION_PROBE_BYTES = 2 * 1024 * 1024;

type ParsedAudio = { artist: string; album: string | null; title: string };

function stripFilenameTags(name: string): string {
  return name
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseFlatFilename(fileNameNoExt: string): ParsedAudio | null {
  const cleaned = stripFilenameTags(fileNameNoExt);
  const sepIdx = cleaned.indexOf(" - ");
  if (sepIdx <= 0) return null;
  const artist = cleaned.slice(0, sepIdx).trim();
  const title = cleaned.slice(sepIdx + 3).trim();
  if (!artist || !title) return null;
  return { artist, album: null, title };
}

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
  if (parts.length === 0) return null;
  const fileName = parts.pop() as string;
  const fileNameNoExt = fileName.slice(0, -AUDIO_EXT.length).trim();
  if (!fileNameNoExt) return null;

  if (parts.length >= 2) {
    return {
      artist: parts[0],
      album: parts[parts.length - 1],
      title: fileNameNoExt,
    };
  }
  if (parts.length === 1) {
    return { artist: parts[0], album: null, title: fileNameNoExt };
  }
  const flat = parseFlatFilename(fileNameNoExt);
  if (!flat) return null;
  return { ...flat, album: flat.title };
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

function pickImage(key: string, pool: string[]): string | null {
  if (!pool.length) return null;
  const h = createHash("sha1").update(key).digest();
  return pool[h.readUInt32BE(0) % pool.length];
}

async function listImageUrls(bucket: Bucket, prefix: string): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix });
  return files
    .map((f) => f.name)
    .filter((n) => IMAGE_EXTS.some((ext) => n.toLowerCase().endsWith(ext)))
    .map((n) => publicUrl(BUCKET_NAME, n));
}

async function listAudioPaths(bucket: Bucket, prefix: string): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix });
  return files.map((f) => f.name).filter((n) => n.toLowerCase().endsWith(AUDIO_EXT));
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const storage = getStorage();
  const bucket = storage.bucket(BUCKET_NAME);

  console.log(
    `[sync-gcs] bucket=${BUCKET_NAME} audio=${AUDIO_PREFIX} artists=${ARTIST_IMAGE_PREFIX} covers=${ALBUM_COVER_PREFIX}`,
  );

  const [audioPaths, artistImages, coverImages] = await Promise.all([
    listAudioPaths(bucket, AUDIO_PREFIX),
    listImageUrls(bucket, ARTIST_IMAGE_PREFIX),
    listImageUrls(bucket, ALBUM_COVER_PREFIX),
  ]);

  const artistImagePool = artistImages.length ? artistImages : coverImages;

  console.log(
    `[sync-gcs] discovered audio=${audioPaths.length} artist_images=${artistImages.length} covers=${coverImages.length} (artist fallback=${artistImages.length ? "none" : "covers"})`,
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
            imageUrl: pickImage(`artist:${parsed.artist}`, artistImagePool),
          },
        });
      } else if (!artist.imageUrl && artistImagePool.length) {
        artist = await prisma.artist.update({
          where: { id: artist.id },
          data: { imageUrl: pickImage(`artist:${parsed.artist}`, artistImagePool) },
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
              coverUrl: pickImage(
                `album:${artist.id}:${parsed.album}`,
                coverImages,
              ),
            },
          });
        } else if (!album.coverUrl && coverImages.length) {
          album = await prisma.album.update({
            where: { id: album.id },
            data: {
              coverUrl: pickImage(
                `album:${artist.id}:${parsed.album}`,
                coverImages,
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

  await revalidateCatalog(created + updated);
}

async function revalidateCatalog(changedCount: number): Promise<void> {
  const appUrl = process.env.APP_URL;
  const token = process.env.SYNC_REVALIDATE_TOKEN;
  if (!appUrl || !token) {
    console.log("[sync-gcs] revalidation skipped (APP_URL or SYNC_REVALIDATE_TOKEN not set)");
    return;
  }
  if (changedCount === 0) {
    console.log("[sync-gcs] no changes, skipping revalidation");
    return;
  }
  try {
    const res = await fetch(`${appUrl.replace(/\/$/, "")}/api/admin/revalidate-catalog`, {
      method: "POST",
      headers: { "x-revalidate-token": token },
    });
    if (!res.ok) {
      console.warn(`[sync-gcs] revalidation failed: ${res.status} ${await res.text()}`);
    } else {
      console.log("[sync-gcs] cache revalidated");
    }
  } catch (err) {
    console.warn(`[sync-gcs] revalidation error: ${(err as Error).message}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
