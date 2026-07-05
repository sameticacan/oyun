import { db } from "../lib/db";
import { runPriceCheck } from "../lib/scraper/runner";

runPriceCheck("demo")
  .then((run) => console.log(`Demo kontrol tamamlandı: ${run.succeeded}/${run.requested} başarılı, ${run.failed} hatalı.`))
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
