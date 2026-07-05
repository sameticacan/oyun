import { CompetitorManager } from "@/components/competitor-manager";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function CompetitorsPage() {
  const competitors = await db.competitor.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { profiles: true, observations: true } } } });
  return <><PageHeader eyebrow="Portföy" title="Rakip Oteller" description="Karşılaştırdığınız otelleri, kaynaklarını ve takip durumlarını yönetin." /><CompetitorManager competitors={competitors} /></>;
}
