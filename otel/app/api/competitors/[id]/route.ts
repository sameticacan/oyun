import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { competitorSchema } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = competitorSchema.parse(await request.json());
    return NextResponse.json(await db.competitor.update({ where: { id }, data: {
      ...input,
      publicUrl: input.publicUrl || null,
      priceSelector: input.priceSelector ?? null,
      roomSelector: input.roomSelector ?? null,
      boardSelector: input.boardSelector ?? null,
      cancellationSelector: input.cancellationSelector ?? null,
      availabilitySelector: input.availabilitySelector ?? null,
    } }));
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await db.competitor.delete({ where: { id } }); return new NextResponse(null, { status: 204 }); }
  catch (error) { return apiError(error); }
}
