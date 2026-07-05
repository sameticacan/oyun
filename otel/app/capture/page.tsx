import { CaptureForm } from "@/components/capture-form";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CapturePage({ searchParams }: { searchParams: Promise<{ competitorId?: string; profileId?: string }> }) {
  const filters = await searchParams;
  const [competitors, profiles] = await Promise.all([
    db.competitor.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, publicUrl: true } }),
    db.searchProfile.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return <>
    <PageHeader eyebrow="Manuel yakalama" title="Fiyat Yakala" description="Kendi tarayıcınızda gördüğünüz public fiyat metnini yapıştırın, bulunan adayları kontrol edin ve gözlem olarak kaydedin." />
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">Bu özellik CAPTCHA, login veya erişim kontrolünü aşmaz ve üçüncü taraf siteye otomatik istek göndermez. Yalnızca sizin kopyaladığınız görünür metni işler.</div>
    <CaptureForm competitors={competitors} profiles={profiles} initialCompetitorId={filters.competitorId} initialProfileId={filters.profileId} />
  </>;
}
