import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { competitorIds, ...input } = profileSchema.parse(await request.json());
    return NextResponse.json(await db.$transaction(async (tx) => {
      await tx.competitorProfile.deleteMany({ where: { profileId: id } });
      return tx.searchProfile.update({ where: { id }, data: { ...input, competitors: { create: competitorIds.map((competitorId) => ({ competitorId })) } } });
    }));
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await db.searchProfile.delete({ where: { id } }); return new NextResponse(null, { status: 204 }); }
  catch (error) { return apiError(error); }
}
