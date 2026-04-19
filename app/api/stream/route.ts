import { NextRequest, NextResponse } from "next/server";
import { getGcsCredentials, generateV4SignedUrl } from "@/lib/gcs";

export async function GET(req: NextRequest) {
  const audioUrl = req.nextUrl.searchParams.get("url");
  if (!audioUrl) return new NextResponse("Missing URL parameter", { status: 400 });

  try {
    const creds = getGcsCredentials();
    const signedUrl = generateV4SignedUrl(audioUrl, creds);

    const fetchHeaders: HeadersInit = {};
    const range = req.headers.get("range");
    if (range) fetchHeaders["Range"] = range;

    const gcsRes = await fetch(signedUrl, { headers: fetchHeaders });

    if (!gcsRes.ok) {
      const errText = await gcsRes.text();
      console.error(`GCS error ${gcsRes.status}:`, errText);
      return new NextResponse(`GCS error: ${gcsRes.status}`, { status: gcsRes.status });
    }

    const headers = new Headers();
    headers.set("Content-Type", gcsRes.headers.get("Content-Type") || "audio/mpeg");
    headers.set("Accept-Ranges", "bytes");
    if (gcsRes.headers.has("Content-Length")) headers.set("Content-Length", gcsRes.headers.get("Content-Length")!);
    if (gcsRes.headers.has("Content-Range")) headers.set("Content-Range", gcsRes.headers.get("Content-Range")!);

    return new NextResponse(gcsRes.body, {
      status: gcsRes.status === 206 ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("Stream Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
