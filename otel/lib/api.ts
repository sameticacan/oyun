import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Geçersiz veri", details: error.flatten() }, { status: 400 });
  console.error(error);
  return NextResponse.json({ error: error instanceof Error ? error.message : "Beklenmeyen sunucu hatası" }, { status: 500 });
}
