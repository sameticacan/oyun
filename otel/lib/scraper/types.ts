import type { Competitor, SearchProfile } from "@prisma/client";

export type ScrapeContext = { competitor: Competitor; profile: SearchProfile };

export type AdapterObservation = {
  status: "success" | "unavailable" | "blocked" | "error";
  sourceUrl?: string;
  roomName?: string;
  boardType?: string;
  cancellationPolicy?: string;
  availabilityText?: string;
  priceAmount?: number;
  currency: string;
  rawSnapshotText?: string;
  errorMessage?: string;
};

export interface PriceSourceAdapter {
  readonly source: "manual" | "demo" | "ets_placeholder";
  check(context: ScrapeContext): Promise<AdapterObservation[]>;
}
