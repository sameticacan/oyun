import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { dateOnly } from "@/lib/utils";
import { ownPriceSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = ownPriceSchema.parse(await request.json());
    const date = dateOnly(input.date);
    return NextResponse.json(await db.ownHotelPrice.upsert({
      where: { profileId_date: { profileId: input.profileId, date } },
      create: { ...input, date }, update: { priceAmount: input.priceAmount, currency: input.currency },
    }));
  } catch (error) { return apiError(error); }
}
