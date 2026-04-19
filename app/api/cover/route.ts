import { NextRequest, NextResponse } from "next/server";
import { getGcsCredentials, generateV4SignedUrl } from "@/lib/gcs";

const SIGNED_URL_TTL = 6 * 24 * 60 * 60;
const REDIRECT_CACHE = 24 * 60 * 60;

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) return new NextResponse("Missing URL parameter", { status: 400 });
  if (!target.startsWith("https://storage.googleapis.com/")) {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  try {
    const creds = getGcsCredentials();
    const signedUrl = generateV4SignedUrl(target, creds, SIGNED_URL_TTL);
    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": `public, max-age=${REDIRECT_CACHE}, immutable`,
      },
    });
  } catch (error) {
    console.error("Cover Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
