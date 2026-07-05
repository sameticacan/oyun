import { CompetitorSource, ObservationStatus, ScrapeRunStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { addDays } from "@/lib/utils";
import { DemoAdapter } from "./demo-adapter";
import { EtsPlaceholderAdapter } from "./ets-placeholder-adapter";
import { ManualAdapter } from "./manual-adapter";
import { withSourceRateLimit } from "./rate-limiter";
import type { PriceSourceAdapter } from "./types";

const adapters: Record<CompetitorSource, PriceSourceAdapter> = {
  demo: new DemoAdapter(), manual: new ManualAdapter(), ets_placeholder: new EtsPlaceholderAdapter(),
};

export async function runPriceCheck(source: CompetitorSource, requestedProfileId?: string) {
  const profiles = await db.searchProfile.findMany({
    where: requestedProfileId ? { id: requestedProfileId } : { competitors: { some: { competitor: { source, active: true } } } },
    include: { competitors: { include: { competitor: true } } },
  });
  const targets = profiles.flatMap((profile) => profile.competitors.filter(({ competitor }) => competitor.active && competitor.source === source).map(({ competitor }) => ({ profile, competitor })));
  const run = await db.scrapeRun.create({ data: { source, profileId: requestedProfileId, requested: targets.length } });
  let succeeded = 0, blocked = 0, failed = 0;

  try {
    for (const target of targets) {
      const results = await withSourceRateLimit(source, () => adapters[source].check(target));
      for (const result of results) {
        if (result.status === "success") succeeded++;
        if (result.status === "blocked") blocked++;
        if (result.status === "error") failed++;
        await db.priceObservation.create({ data: {
          competitorId: target.competitor.id, profileId: target.profile.id, scrapeRunId: run.id, source,
          sourceUrl: result.sourceUrl, roomName: result.roomName, boardType: result.boardType,
          cancellationPolicy: result.cancellationPolicy, availabilityText: result.availabilityText,
          priceAmount: result.priceAmount, currency: result.currency, checkIn: target.profile.checkIn,
          checkOut: addDays(target.profile.checkIn, target.profile.nights), adults: target.profile.adults,
          children: target.profile.children, rawSnapshotText: result.rawSnapshotText,
          status: result.status as ObservationStatus, errorMessage: result.errorMessage,
        } });
      }
    }
    const status = failed ? ScrapeRunStatus.partial : blocked === targets.length && targets.length > 0 ? ScrapeRunStatus.blocked : ScrapeRunStatus.completed;
    return await db.scrapeRun.update({ where: { id: run.id }, data: { status, succeeded, blocked, failed, finishedAt: new Date() } });
  } catch (error) {
    await db.scrapeRun.update({ where: { id: run.id }, data: { status: ScrapeRunStatus.failed, succeeded, blocked, failed: failed + 1, finishedAt: new Date(), errorMessage: error instanceof Error ? error.message : "Bilinmeyen hata" } });
    throw error;
  }
}
