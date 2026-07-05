import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";

export async function GET(request: Request) {
  const profileId = new URL(request.url).searchParams.get("profileId") ?? undefined;
  return NextResponse.json(await getDashboardData(profileId));
}
