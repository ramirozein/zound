import { createSign, createHash } from "crypto";

export interface GoogleCredentials {
  client_email: string;
  private_key: string;
}

export function getGcsCredentials(): GoogleCredentials {
  const rawKey = process.env.GOOGLE_KEY;
  if (!rawKey) throw new Error("Missing GOOGLE_KEY");
  const creds = JSON.parse(Buffer.from(rawKey, "base64").toString("utf8"));
  creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  return creds;
}

export function generateV4SignedUrl(
  gcsUrl: string,
  creds: GoogleCredentials,
  expiresIn = 900,
): string {
  const url = new URL(gcsUrl);
  const [, bucket, ...rawParts] = url.pathname.split("/");
  const objectPath = rawParts.map(decodeURIComponent).join("/");

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

export function proxyCoverUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (!url.startsWith("https://storage.googleapis.com/")) return url;
  return `/api/cover?url=${encodeURIComponent(url)}`;
}
