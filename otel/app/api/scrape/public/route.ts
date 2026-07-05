import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { runPriceCheck } from "@/lib/scraper/runner";

export async function POST(request: Request) {
  try {
    if (process.env.ENABLE_PUBLIC_PRICE_CHECKS !== "true") {
      return NextResponse.json({ error: "Public kontroller .env içinde kapalı" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const run = await runPriceCheck("ets_placeholder", typeof body.profileId === "string" ? body.profileId : undefined);
    return NextResponse.json(run);
  } catch (error) { return apiError(error); }
}
