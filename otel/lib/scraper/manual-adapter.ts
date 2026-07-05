import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import type { PriceSourceAdapter, ScrapeContext } from "./types";

export class ManualAdapter implements PriceSourceAdapter {
  readonly source = "manual" as const;
  async check({ competitor, profile }: ScrapeContext) {
    const latest = await db.priceObservation.findFirst({
      where: { competitorId: competitor.id, profileId: profile.id, source: "manual", status: "success", priceAmount: { not: null } },
      orderBy: { observedAt: "desc" },
    });
    if (!latest) return [{ status: "unavailable" as const, currency: profile.currency, availabilityText: "Manuel fiyat henüz girilmedi", rawSnapshotText: "Ağ isteği yapılmadı." }];
    return [{
      status: "success" as const, currency: latest.currency, priceAmount: toNumber(latest.priceAmount)!,
      sourceUrl: latest.sourceUrl ?? undefined, roomName: latest.roomName ?? undefined,
      boardType: latest.boardType ?? undefined, cancellationPolicy: latest.cancellationPolicy ?? undefined,
      availabilityText: latest.availabilityText ?? "Manuel fiyat", rawSnapshotText: "Son manuel gözlem okundu; ağ isteği yapılmadı.",
    }];
  }
}
