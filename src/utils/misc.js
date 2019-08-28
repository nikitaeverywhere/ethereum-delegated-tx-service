/**
 * Loops the function every {interval}, but waits until the previous job is done.
 * @param {number} interval - Minimum time in milliseconds to wait between loops.
 *                            If the job takes more than this, the next job will execute simultaneously after the previous one.
 * @param {Function} f - Job.
 * @returns {undefined} - Self-executable function.
 */
export async function loopEvery (interval, f) {

  let canceled = false;
  const cancel = async () => {
    canceled = true;
    await promise;
  };
  const promise = new Promise(async function (resolve) {

    while (true) {

        const startTime = Date.now();

        if (canceled) {
          resolve();
          break;
        }

        try {
            await f();
        } catch (e) {
            console.error(e);
            console.info("Exiting <SigInt>.");
            process.emit("SIGINT");
        }

        if (canceled) {
          resolve();
          break;
        }

        const wait = Math.max(0, interval + startTime - Date.now());
        // if (wait > 0) console.info(`Waiting ${ Math.floor(wait / 10) / 100 } seconds before the next run...`);
        await new Promise(resolve => setTimeout(resolve, wait));

    }

  });

  return cancel;

}