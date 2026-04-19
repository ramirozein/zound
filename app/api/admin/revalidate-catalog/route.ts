import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const expected = process.env.SYNC_REVALIDATE_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const provided = req.headers.get("x-revalidate-token");
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("catalog", "max");
  return NextResponse.json({ revalidated: true, tag: "catalog" });
}
