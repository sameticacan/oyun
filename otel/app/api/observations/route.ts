import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { addDays } from "@/lib/utils";
import { manualObservationSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const competitorId = searchParams.get("competitorId") ?? undefined;
  const profileId = searchParams.get("profileId") ?? undefined;
  const status = searchParams.get("status") as "success" | "unavailable" | "blocked" | "error" | null;
  const take = Math.min(500, Math.max(1, Number(searchParams.get("limit") ?? 100)));
  const data = await db.priceObservation.findMany({
    where: { competitorId, profileId, status: status ?? undefined }, take, orderBy: { observedAt: "desc" },
    include: { competitor: { select: { name: true } }, profile: { select: { name: true } } },
  });
  return NextResponse.json(data.map((item) => ({ ...item, priceAmount: item.priceAmount?.toString() ?? null })));
}

export async function POST(request: Request) {
  try {
    const input = manualObservationSchema.parse(await request.json());
    const [competitor, profile] = await Promise.all([
      db.competitor.findUniqueOrThrow({ where: { id: input.competitorId } }),
      db.searchProfile.findUniqueOrThrow({ where: { id: input.profileId } }),
    ]);
    return NextResponse.json(await db.priceObservation.create({ data: {
      ...input, source: "manual", sourceUrl: competitor.publicUrl, currency: profile.currency,
      checkIn: profile.checkIn, checkOut: addDays(profile.checkIn, profile.nights), adults: profile.adults,
      children: profile.children, status: "success", rawSnapshotText: "Kullanıcı tarafından manuel girildi.",
    } }), { status: 201 });
  } catch (error) { return apiError(error); }
}
