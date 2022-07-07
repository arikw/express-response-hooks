const EventEmitter = require('events');

module.exports = function constructor(options = {}) {

  const { plugName = 'hooks' } = options;

  return function (req, res, next) {

    const emitter = new EventEmitter();
    res[plugName] = emitter;

    let statusCode = res.statusCode;
    Object.defineProperty(res, 'statusCode', {
      get: () => statusCode,
      set: (code) => {
        const data = [ code ];
        emitter.emit('statusCode', data);
        statusCode = data[0];
      }
    });

    const wrappedFunctionNames = [
      'set', 'send'
    ];

    for (const funcName of wrappedFunctionNames) {
      const originalFn = res[funcName].bind(res);
      res[funcName] = function hookWrapper(...args) {
        emitter.emit(funcName, args);
        return originalFn.call(res, ...args);
      };
      res[funcName][`_${plugName}_originalFn`] = originalFn;
    }

    emitter.bypass = Object.fromEntries(
      wrappedFunctionNames.map(funcName => [funcName, res[funcName][`_${plugName}_originalFn`]])
    );

    next();
  };
};
