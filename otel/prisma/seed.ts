import { CompetitorSource, ObservationStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const day = 86_400_000;

function atUtcDate(offset: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
}

async function main() {
  await prisma.priceObservation.deleteMany();
  await prisma.scrapeRun.deleteMany();
  await prisma.ownHotelPrice.deleteMany();
  await prisma.competitorProfile.deleteMany();
  await prisma.searchProfile.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.appSetting.deleteMany();

  const competitorData = [
    ["Körfez Butik Otel", "Karşıyaka", 3350],
    ["Mavi Kordon Hotel", "Karşıyaka", 3825],
    ["Yalı Konak", "Karşıyaka", 3090],
    ["Alsancak Rota", "Alsancak", 4250],
    ["Bornova Bahçe Otel", "Bornova", 2940],
  ] as const;

  const competitors = [];
  for (const [name, district] of competitorData) {
    competitors.push(await prisma.competitor.create({
      data: { name, city: "İzmir", district, source: CompetitorSource.demo, active: true, notes: "Demo rakip otel" },
    }));
  }

  const profileInputs = [
    { name: "Hafta içi · 2 kişi", checkIn: atUtcDate(1), nights: 1, adults: 2, children: 0, boardPreference: "breakfast_included" },
    { name: "Hafta sonu · 2 gece", checkIn: atUtcDate(5), nights: 2, adults: 2, children: 0, boardPreference: "breakfast_included" },
    { name: "Aile · 2+1", checkIn: atUtcDate(10), nights: 3, adults: 2, children: 1, boardPreference: "room_only" },
  ];

  const profiles = [];
  for (const input of profileInputs) {
    profiles.push(await prisma.searchProfile.create({
      data: { ...input, currency: "TRY", competitors: { create: competitors.map((competitor) => ({ competitorId: competitor.id })) } },
    }));
  }

  const observations = [];
  for (let dateIndex = 29; dateIndex >= 0; dateIndex--) {
    for (let competitorIndex = 0; competitorIndex < competitors.length; competitorIndex++) {
      const competitor = competitors[competitorIndex];
      const profile = profiles[0];
      const base = competitorData[competitorIndex][2];
      const wave = Math.sin((29 - dateIndex + competitorIndex) / 3) * 170;
      const trend = (29 - dateIndex) * 8;
      const price = Math.round((base + wave + trend) / 10) * 10;
      const observedAt = new Date(atUtcDate(-dateIndex).getTime() + 9 * 3_600_000);
      observations.push({
        competitorId: competitor.id,
        profileId: profile.id,
        source: CompetitorSource.demo,
        sourceUrl: null,
        roomName: "Standart Oda",
        boardType: "Kahvaltı dahil",
        cancellationPolicy: "Girişten 2 gün öncesine kadar ücretsiz iptal",
        availabilityText: "Müsait",
        priceAmount: price,
        currency: "TRY",
        checkIn: profile.checkIn,
        checkOut: new Date(profile.checkIn.getTime() + profile.nights * day),
        adults: profile.adults,
        children: profile.children,
        observedAt,
        rawSnapshotText: `Demo veri · ${competitor.name} · ${price} TRY`,
        status: ObservationStatus.success,
      });
    }
  }
  await prisma.priceObservation.createMany({ data: observations });

  for (let dateIndex = 29; dateIndex >= 0; dateIndex--) {
    await prisma.ownHotelPrice.create({
      data: { profileId: profiles[0].id, date: atUtcDate(-dateIndex), priceAmount: 3450 + (29 - dateIndex) * 7, currency: "TRY" },
    });
  }

  await prisma.appSetting.createMany({ data: [
    { key: "ENABLE_PUBLIC_PRICE_CHECKS", value: "false", description: "Görsel durum göstergesidir; gerçek yetkilendirme yalnızca ortam değişkeninden gelir." },
    { key: "SCRAPER_MIN_INTERVAL_MS", value: "60000", description: "Aynı kaynağa istekler arasındaki en kısa süre." },
  ] });

  console.log(`Seed tamamlandı: ${competitors.length} rakip, ${profiles.length} profil, ${observations.length} gözlem.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
