import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";

export async function getDashboardData(profileId?: string) {
  const profile = profileId
    ? await db.searchProfile.findUnique({ where: { id: profileId } })
    : await db.searchProfile.findFirst({ orderBy: { createdAt: "asc" } });
  const profiles = await db.searchProfile.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true } });
  const competitors = await db.competitor.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const observations = profile ? await db.priceObservation.findMany({
    where: { profileId: profile.id, status: "success", priceAmount: { not: null } },
    orderBy: { observedAt: "asc" }, include: { competitor: { select: { name: true } } },
  }) : [];
  const ownPrices = profile ? await db.ownHotelPrice.findMany({ where: { profileId: profile.id }, orderBy: { date: "asc" } }) : [];
  const latestRun = await db.scrapeRun.findFirst({ orderBy: { startedAt: "desc" } });

  const latestByCompetitor = new Map<string, typeof observations[number]>();
  for (const observation of observations) {
    const previous = latestByCompetitor.get(observation.competitorId);
    if (!previous || previous.observedAt < observation.observedAt) latestByCompetitor.set(observation.competitorId, observation);
  }
  const latestCompetitors = competitors.map((competitor) => {
    const observation = latestByCompetitor.get(competitor.id);
    return { id: competitor.id, name: competitor.name, district: competitor.district, source: competitor.source, price: toNumber(observation?.priceAmount), currency: observation?.currency ?? profile?.currency ?? "TRY", observedAt: observation?.observedAt ?? null };
  });
  const availablePrices = latestCompetitors.flatMap((item) => item.price == null ? [] : [item.price]);
  const marketAverage = availablePrices.length ? availablePrices.reduce((sum, value) => sum + value, 0) / availablePrices.length : null;
  const latestOwn = ownPrices.at(-1);
  const ownPrice = toNumber(latestOwn?.priceAmount);
  let recommendation = "Karşılaştırma için fiyat girin";
  let recommendationTone: "low" | "high" | "near" | "empty" = "empty";
  if (marketAverage && ownPrice != null) {
    if (ownPrice <= marketAverage * 0.9) { recommendation = "Piyasanın altında olabilirsiniz"; recommendationTone = "low"; }
    else if (ownPrice >= marketAverage * 1.1) { recommendation = "Piyasanın üstünde olabilirsiniz"; recommendationTone = "high"; }
    else { recommendation = "Piyasa seviyesindesiniz"; recommendationTone = "near"; }
  }

  const daily = new Map<string, { values: number[]; cheapest?: { name: string; price: number } }>();
  for (const observation of observations) {
    const date = observation.observedAt.toISOString().slice(0, 10);
    const price = toNumber(observation.priceAmount)!;
    const point = daily.get(date) ?? { values: [] };
    point.values.push(price);
    if (!point.cheapest || price < point.cheapest.price) point.cheapest = { name: observation.competitor.name, price };
    daily.set(date, point);
  }
  const ownByDate = new Map(ownPrices.map((item) => [item.date.toISOString().slice(0, 10), toNumber(item.priceAmount)]));
  const trends = [...daily.entries()].map(([date, point]) => ({
    date, average: Math.round(point.values.reduce((a, b) => a + b, 0) / point.values.length), ownPrice: ownByDate.get(date) ?? null,
    cheapestPrice: point.cheapest?.price ?? null, cheapestName: point.cheapest?.name ?? "—",
  })).slice(-30);

  return { profile, profiles, latestCompetitors, marketAverage, ownPrice, recommendation, recommendationTone, trends, latestRun };
}
