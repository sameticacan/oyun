import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { addDays } from "@/lib/utils";
import { captureObservationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = captureObservationSchema.parse(await request.json());
    const [competitor, profile] = await Promise.all([
      db.competitor.findUniqueOrThrow({ where: { id: input.competitorId } }),
      db.searchProfile.findUniqueOrThrow({ where: { id: input.profileId } }),
    ]);
    return NextResponse.json(await db.priceObservation.create({ data: {
      competitorId: competitor.id,
      profileId: profile.id,
      source: "manual",
      sourceUrl: input.sourceUrl ?? competitor.publicUrl,
      roomName: input.roomName,
      boardType: input.boardType,
      cancellationPolicy: input.cancellationPolicy,
      availabilityText: input.availabilityText,
      priceAmount: input.priceAmount,
      currency: input.currency,
      checkIn: profile.checkIn,
      checkOut: addDays(profile.checkIn, profile.nights),
      adults: profile.adults,
      children: profile.children,
      status: "success",
      rawSnapshotText: `Tarayıcıdan Yakala ile kaydedildi.\n\n${input.rawSnapshotText}`,
    } }), { status: 201 });
  } catch (error) { return apiError(error); }
}
