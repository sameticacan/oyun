import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validation";

export async function GET() {
  return NextResponse.json(await db.searchProfile.findMany({ orderBy: { createdAt: "desc" }, include: { competitors: { include: { competitor: true } }, _count: { select: { observations: true } } } }));
}

export async function POST(request: Request) {
  try {
    const { competitorIds, ...input } = profileSchema.parse(await request.json());
    return NextResponse.json(await db.searchProfile.create({ data: { ...input, competitors: { create: competitorIds.map((competitorId) => ({ competitorId })) } } }), { status: 201 });
  } catch (error) { return apiError(error); }
}
