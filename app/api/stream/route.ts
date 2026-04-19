import { NextRequest, NextResponse } from "next/server";
import { createSign, createHash } from "crypto";

interface GoogleCredentials {
  client_email: string;
  private_key: string;
}

function getCredentials(): GoogleCredentials {
  const rawKey = process.env.GOOGLE_KEY;
  if (!rawKey) throw new Error("Missing GOOGLE_KEY");
  const creds = JSON.parse(Buffer.from(rawKey, "base64").toString("utf8"));
  creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  return creds;
}

function generateV4SignedUrl(gcsUrl: string, creds: GoogleCredentials): string {
  const url = new URL(gcsUrl);
  const [, bucket, ...rawParts] = url.pathname.split("/");
  const objectPath = rawParts.map(decodeURIComponent).join("/");

  const expiresIn = 900;
  const now = new Date();
  const dateTime = now.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const datestamp = dateTime.slice(0, 8);

  const credentialScope = `${datestamp}/auto/storage/goog4_request`;
  const credential = `${creds.client_email}/${credentialScope}`;
  const encodedObject = objectPath.split("/").map(encodeURIComponent).join("/");
  const canonicalUri = `/${bucket}/${encodedObject}`;

  const queryString = [
    "X-Goog-Algorithm=GOOG4-RSA-SHA256",
    `X-Goog-Credential=${encodeURIComponent(credential)}`,
    `X-Goog-Date=${dateTime}`,
    `X-Goog-Expires=${expiresIn}`,
    "X-Goog-SignedHeaders=host",
  ].join("&");

  const canonicalRequest = [
    "GET",
    canonicalUri,
    queryString,
    "host:storage.googleapis.com\n",
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const requestHash = createHash("sha256").update(canonicalRequest).digest("hex");
  const stringToSign = ["GOOG4-RSA-SHA256", dateTime, credentialScope, requestHash].join("\n");

  const sign = createSign("RSA-SHA256");
  sign.update(stringToSign);
  const signature = sign.sign(creds.private_key, "hex");

  return `https://storage.googleapis.com${canonicalUri}?${queryString}&X-Goog-Signature=${signature}`;
}

export async function GET(req: NextRequest) {
  const audioUrl = req.nextUrl.searchParams.get("url");
  if (!audioUrl) return new NextResponse("Missing URL parameter", { status: 400 });

  try {
    const creds = getCredentials();
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
