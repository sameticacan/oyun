import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { runPriceCheck } from "@/lib/scraper/runner";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const run = await runPriceCheck("demo", typeof body.profileId === "string" ? body.profileId : undefined);
    return NextResponse.json(run);
  } catch (error) { return apiError(error); }
}
