import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imagePath = searchParams.get("path");

  if (!imagePath || !existsSync(imagePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const imageBuffer = readFileSync(imagePath);
  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
