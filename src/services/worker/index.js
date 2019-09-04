import { loopEvery } from "../../utils/misc";
import { syncAndPublish } from "../../modules/transactions";

export async function startWorker () {
  console.info(`${ new Date().toISOString() } | Starting worker...`);
  await loopEvery(10000, async () => {
    console.info(`${ new Date().toISOString() } | Syncing pending transactions...`);
    await syncAndPublish();
    console.info(`${ new Date().toISOString() } | Pending transactions synced.`);
  });
}