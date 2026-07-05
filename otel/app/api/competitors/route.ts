import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { competitorSchema } from "@/lib/validation";

export async function GET() {
  return NextResponse.json(await db.competitor.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { profiles: true, observations: true } } } }));
}

export async function POST(request: Request) {
  try {
    const input = competitorSchema.parse(await request.json());
    return NextResponse.json(await db.competitor.create({ data: {
      ...input,
      publicUrl: input.publicUrl || null,
      priceSelector: input.priceSelector ?? null,
      roomSelector: input.roomSelector ?? null,
      boardSelector: input.boardSelector ?? null,
      cancellationSelector: input.cancellationSelector ?? null,
      availabilitySelector: input.availabilitySelector ?? null,
    } }), { status: 201 });
  } catch (error) { return apiError(error); }
}
