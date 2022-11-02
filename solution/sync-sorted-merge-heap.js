"use strict";
const { Heap } = require('heap-js');

module.exports = (logSources, printer) => {
  const getSet = () => {
    return logSources.map(log => !log.drained && log.pop() && log)
                     .map(log => ({log: log, time: log.last.date.getTime()})) // Time is faster than comparing dates
  }

  const set = new Heap((a, b) => a.time - b.time);
        set.init(getSet());

  while(set.size()) {
    const {log} = set.pop() || {};

    log && printer.print(log.last);

    const next = log?.pop();
    if(next) {
      const time = next.date.getTime();
      set.push({log, time});
    }
  }

  return printer.done();
};
