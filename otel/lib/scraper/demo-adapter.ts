import type { PriceSourceAdapter, ScrapeContext } from "./types";

function stableNumber(value: string) {
  return [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
}

export class DemoAdapter implements PriceSourceAdapter {
  readonly source = "demo" as const;

  async check({ competitor, profile }: ScrapeContext) {
    const dayKey = new Date().toISOString().slice(0, 10);
    const seed = stableNumber(`${competitor.id}:${profile.id}:${dayKey}`);
    const price = 2600 + (seed % 2200) + profile.nights * 180 + profile.children * 250;
    const unavailable = seed % 29 === 0;

    if (unavailable) return [{ status: "unavailable" as const, currency: profile.currency, availabilityText: "Seçilen tarihlerde müsait değil", rawSnapshotText: "Demo: müsaitlik yok" }];

    return [{
      status: "success" as const,
      sourceUrl: competitor.publicUrl ?? undefined,
      roomName: seed % 2 ? "Standart Çift Kişilik Oda" : "Deluxe Oda",
      boardType: profile.boardPreference === "breakfast_included" ? "Kahvaltı dahil" : "Sadece oda",
      cancellationPolicy: seed % 3 ? "Girişten 2 gün öncesine kadar ücretsiz iptal" : "İade edilemez",
      availabilityText: seed % 5 === 0 ? "Son 2 oda" : "Müsait",
      priceAmount: Math.round(price / 10) * 10,
      currency: profile.currency,
      rawSnapshotText: `OdaRadar kontrollü demo üretimi · seed ${seed}`,
    }];
  }
}
