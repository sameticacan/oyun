import { PageHeader } from "@/components/page-header";
import { ProfileManager } from "@/components/profile-manager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function ProfilesPage() {
  const [profiles, competitors] = await Promise.all([
    db.searchProfile.findMany({ orderBy: { createdAt: "desc" }, include: { competitors: { include: { competitor: { select: { id: true, name: true } } } }, _count: { select: { observations: true } } } }),
    db.competitor.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return <><PageHeader eyebrow="Arama bağlamı" title="Arama Profilleri" description="Her fiyatın tarih, konuk sayısı, pansiyon ve para birimi bağlamını eksiksiz tanımlayın." /><ProfileManager profiles={profiles.map((p) => ({ ...p, checkIn: p.checkIn.toISOString() }))} competitors={competitors} /></>;
}
