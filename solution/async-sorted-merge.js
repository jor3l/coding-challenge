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

const WAIT_TIME = 2;

if(isMainThread) {
  module.exports = (logSources, printer) => {
    return new Promise(async (resolve) => {
      const worker = new Worker(__filename);
            worker.on('message', (log) => {
              log = JSON.parse(log);
              log.date = new Date(log.time);
              printer.print(log)
            });
            worker.on('exit', () => printer.done() && resolve());

      await Promise.all(logSources.map(logSource => {
        return new Promise(async (resolve) => {
          while(!logSource.drained) {
            const element = await logSource.popAsync();
            element && worker.postMessage(JSON.stringify({msg: element.msg, time: element.date.getTime()}));
          }

          resolve();
        })
      }));
    });
  };
} else {
  const set = new Heap((a, b) => a.time - b.time);
  
  parentPort.on('message', (log) => {
    set.push(JSON.parse(log));
  });

  async function pullLogSource() {
    await wait(WAIT_TIME);

    while(set.size()) {
      const log = set.pop();
      parentPort.postMessage(JSON.stringify(log));
      await wait(WAIT_TIME);
    }
  }

  pullLogSource().then(() => parentPort.close());
}