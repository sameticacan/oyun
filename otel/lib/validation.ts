import { z } from "zod";

export const sourceSchema = z.enum(["manual", "demo", "ets_placeholder"]);

const optionalSelector = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(500).nullable().optional(),
);

export const competitorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  source: sourceSchema,
  publicUrl: z.union([z.string().url(), z.literal("")]).optional(),
  priceSelector: optionalSelector,
  roomSelector: optionalSelector,
  boardSelector: optionalSelector,
  cancellationSelector: optionalSelector,
  availabilitySelector: optionalSelector,
  active: z.boolean().default(true),
  notes: z.string().max(1000).optional().default(""),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  checkIn: z.coerce.date(),
  nights: z.coerce.number().int().min(1).max(30),
  adults: z.coerce.number().int().min(1).max(10),
  children: z.coerce.number().int().min(0).max(10),
  boardPreference: z.enum(["room_only", "breakfast_included"]),
  currency: z.string().trim().length(3).transform((v) => v.toUpperCase()),
  competitorIds: z.array(z.string().cuid()).default([]),
});

export const ownPriceSchema = z.object({
  profileId: z.string().cuid(),
  date: z.coerce.date(),
  priceAmount: z.coerce.number().positive().max(10000000),
  currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default("TRY"),
});

export const manualObservationSchema = z.object({
  competitorId: z.string().cuid(),
  profileId: z.string().cuid(),
  priceAmount: z.coerce.number().positive().max(10000000),
  roomName: z.string().trim().max(200).optional().default("Standart Oda"),
  boardType: z.string().trim().max(120).optional().default("Belirtilmedi"),
  cancellationPolicy: z.string().trim().max(500).optional().default("Belirtilmedi"),
  availabilityText: z.string().trim().max(300).optional().default("Manuel olarak müsait işaretlendi"),
});

const optionalCaptureText = (maxLength: number) => z.string().trim().max(maxLength).optional().transform((value) => value || undefined);

export const captureObservationSchema = z.object({
  competitorId: z.string().cuid(),
  profileId: z.string().cuid(),
  priceAmount: z.coerce.number().positive().max(10_000_000),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  roomName: optionalCaptureText(200),
  boardType: optionalCaptureText(120),
  cancellationPolicy: optionalCaptureText(500),
  availabilityText: optionalCaptureText(300),
  sourceUrl: z.union([z.string().url(), z.literal("")]).optional().transform((value) => value || undefined),
  rawSnapshotText: z.string().trim().min(1).max(200_000),
});
