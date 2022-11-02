"use strict";
const { Heap } = require('heap-js');
const {
  Worker, isMainThread, parentPort, workerData
} = require('node:worker_threads');

// Print all entries, across all of the sources, in chronological order.

function wait(milisec) {
  return new Promise(resolve => {
      setTimeout(() => { resolve() }, milisec);
  })
}

const WAIT_TIME = 60;

if(isMainThread) {
  module.exports = (logSources, printer) => {
    return new Promise(async (resolve) => {
      const set = new Heap((a, b) => a.time - b.time);
      const workers = new Heap();

      logSources.forEach(logSource => {
        const worker = new Worker(__filename, {
          workerData: logSource
        })

        worker.on('message', (data) => {
          set.push(data);
        })

        worker.on('exit', () => {
          workers.remove(worker);
        })

        workers.push(worker);
      });

      while(workers.size()) { // this means we are still pulling logs
        if(set.size()) printer.print(set.pop());
        await wait(WAIT_TIME); // a wait helps to print logs before they has been pulled.
      }

      printer.done();
      resolve();
    });
  };
} else {
  const logSource = workerData;

  async function pullLogSource() {
    while(!logSource.drained) {
      const element = await logSource.popAsync();
      parentPort.postMessage(element);
    }
  }

  pullLogSource().then(process.exit);
}