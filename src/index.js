import { startApi } from "./services/api";
import { startWorker } from "./services/worker";

(async () => {
  await startWorker();
  await startApi();
})();