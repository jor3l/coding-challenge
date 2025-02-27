"use strict";


module.exports = (logSources, printer) => {
  const getSet = () => {
    return logSources.map(log => !log.drained && log.pop() && log)
                     .map(log => ({log: log, time: log.last.date.getTime()})) // Time is faster than comparing dates
                     .sort((a, b) => a.time - b.time);
  }

  // A set is a sorted array of log sources first element,
  // this is a starting point of logs, then we print the zero log out, fetch the next log
  // and add it back to the array to sort it for the next iteration.

  
  while(set.length > 0) {
    const {log} = set.shift();
    printer.print(log.last);

    let next = log.pop();

    // This exhaust current logSource until we reach the next in line log event
    // note: a tiny improvement because less splices are called on the set array.
    while(next && next.date.getTime() < set[0].time) {
      printer.print(next);
      next = log.pop();
    }

    if(next) {
      const time = next.date.getTime();

      let index = 0;
      while(time > set[index]?.time) {
        index++;
      }

      set.splice(index, 0, {log, time});

      // this also works but the extra sort increases complexity >>
      //set.push({log, time});
      //set = set.sort((a, b) => a.time - b.time);
    }
  }

  return printer.done();
};
