(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.transduceX = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require(4)

},{"4":4}],2:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;

// Defer, delay compose
exports.compose = compose;
exports.callback = callback;
exports.emitInto = emitInto;

var _Prom = require(5);

var _Prom2 = _interopRequireWildcard(_Prom);

var _Transducer$protocols$isReduced$unreduced$identity$comp = require(7);

var _transformer$iterable$transduceImpl$reduceImpl$intoImpl = require(6);

var _protocols$transducer = _Transducer$protocols$isReduced$unreduced$identity$comp.protocols.transducer;
var tInit = _protocols$transducer.init;
var tStep = _protocols$transducer.step;
var tResult = _protocols$transducer.result;

// Transduce, reduce, into
var reduce = _transformer$iterable$transduceImpl$reduceImpl$intoImpl.reduceImpl(_reduce);
exports.reduce = reduce;
var transduce = _transformer$iterable$transduceImpl$reduceImpl$intoImpl.transduceImpl(_reduce);
exports.transduce = transduce;
var into = _transformer$iterable$transduceImpl$reduceImpl$intoImpl.intoImpl(_reduce);

exports.into = into;
var _iterator = function _iterator(coll) {
  return _transformer$iterable$transduceImpl$reduceImpl$intoImpl.iterable(coll)[_Transducer$protocols$isReduced$unreduced$identity$comp.protocols.iterator]();
};
var _iteratorValue = function _iteratorValue(item) {
  return { done: false, value: item };
};

function _reduce(xf, init, coll) {
  if (coll === void 0) {
    coll = init;
    init = xf[tInit]();
  }
  return _Prom2['default'].all([xf, init, coll]).then(function (_ref) {
    var xf = _ref[0];
    var init = _ref[1];
    var coll = _ref[2];
    return new Reduce(_iterator(coll), init, xf).iterate();
  });
}

var Reduce = (function () {
  function Reduce(iter, init, xf) {
    _classCallCheck(this, Reduce);

    this.xf = xf;
    this.iter = iter;
    this.value = init;
    this._step = this.__step.bind(this);
    this._loop = this.__loop.bind(this);
  }

  Reduce.prototype.iterate = function iterate() {
    return _Prom2['default'].resolve(this.next()).then(this._step);
  };

  Reduce.prototype.next = function next() {
    var _this = this;

    return new _Prom2['default'](function (resolve, reject) {
      try {
        var item = _this.iter.next();
        if (!item.done) {
          item = _Prom2['default'].resolve(item.value).then(_iteratorValue);
        }
        resolve(item);
      } catch (e) {
        reject(e);
      }
    });
  };

  Reduce.prototype.__step = function __step(item) {
    var _this2 = this;

    return new _Prom2['default'](function (resolve, reject) {
      try {
        var result;
        if (item.done) {
          result = _this2.xf[tResult](_this2.value);
        } else {
          result = _Prom2['default'].resolve(_this2.xf[tStep](_this2.value, item.value)).then(_this2._loop);
        }
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  Reduce.prototype.__loop = function __loop(value) {
    var _this3 = this;

    this.value = value;
    return new _Prom2['default'](function (resolve, reject) {
      try {
        var result;
        if (_Transducer$protocols$isReduced$unreduced$identity$comp.isReduced(value)) {
          result = _this3.xf[tResult](_Transducer$protocols$isReduced$unreduced$identity$comp.unreduced(value));
        } else {
          result = _this3.iterate();
        }
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  return Reduce;
})();

function compose() {
  for (var _len = arguments.length, fromArgs = Array(_len), _key = 0; _key < _len; _key++) {
    fromArgs[_key] = arguments[_key];
  }

  var toArgs = [],
      len = fromArgs.length,
      i = 0;
  for (; i < len; i++) {
    toArgs.push(fromArgs[i]);
    toArgs.push(defer());
  }
  return _Transducer$protocols$isReduced$unreduced$identity$comp.compose.apply(null, toArgs);
}

var defer = function defer() {
  return delay();
};
exports.defer = defer;
var delay = function delay(wait) {
  return function (xf) {
    return new Delay(wait, xf);
  };
};
exports.delay = delay;

var Delay = (function () {
  function Delay(wait, xf) {
    _classCallCheck(this, Delay);

    var task = new DelayTask(wait, xf);
    this.xf = xf;
    this.task = task;
    this._step = task.step.bind(task);
    this._result = task.result.bind(task);
  }

  Delay.prototype[tInit] = function () {
    if (this.task.resolved) {
      return this.task.resolved;
    }

    return _Prom2['default'].resolve(this.xf[tInit]());
  };

  Delay.prototype[tStep] = function (value, input) {
    if (this.task.resolved) {
      return this.task.resolved;
    }

    return _Prom2['default'].all([value, input]).then(this._step);
  };

  Delay.prototype[tResult] = function (value) {
    if (this.task.resolved) {
      return this.task.resolved;
    }

    return _Prom2['default'].resolve(value).then(this._result);
  };

  return Delay;
})();

var DelayTask = (function () {
  function DelayTask(wait, xf) {
    _classCallCheck(this, DelayTask);

    this.wait = wait;
    this.xf = xf;
    this.q = [];
  }

  DelayTask.prototype.call = function call() {
    var next = this.q[0];
    if (next && !next.processing) {
      next.processing = true;

      var wait = next.wait;
      if (wait > 0) {
        setTimeout(next.fn, wait);
      } else {
        next.fn();
      }
    }
  };

  DelayTask.prototype.step = function step(_ref2) {
    var value = _ref2[0];
    var input = _ref2[1];

    var task = this;
    return new _Prom2['default'](function (resolve, reject) {
      task.q.push({ fn: taskStep, wait: task.wait });
      task.call();

      function taskStep() {
        try {
          resolve(task.xf[tStep](value, input));
          task.q.shift();
          if (task.q.length > 0) {
            task.call();
          }
        } catch (e) {
          reject(e);
        }
      }
    });
  };

  DelayTask.prototype.result = function result(value) {
    var task = this;
    task.resolved = new _Prom2['default'](function (resolve, reject) {
      task.q.push({ fn: taskResult });
      task.call();
      function taskResult() {
        try {
          task.q = [];
          resolve(task.xf[tResult](value));
        } catch (e) {
          reject(e);
        }
      }
    });
    return task.resolved;
  };

  return DelayTask;
})();

// Promises and callbacks
var when = function when(promiseOrValue, t) {
  return _Prom2['default'].resolve(promiseOrValue).then(promiseTransform(t));
};
exports.when = when;
var promiseTransform = function promiseTransform(t) {
  return function (item) {
    return new _Prom2['default'](function (resolve, reject) {
      var cb = callback(t, null, function (err, result) {
        if (err) reject(err);else resolve(result);
      });
      cb(null, item);
      cb();
    });
  };
};

exports.promiseTransform = promiseTransform;

function callback(t, init, continuation) {
  var done = false,
      stepper,
      value,
      xf = _transformer$iterable$transduceImpl$reduceImpl$intoImpl.transformer(init);

  stepper = t(xf);
  value = stepper[tInit]();

  function checkDone(err, item) {
    if (done) {
      return true;
    }

    err = err || null;

    // check if exhausted
    if (_Transducer$protocols$isReduced$unreduced$identity$comp.isReduced(value)) {
      value = _Transducer$protocols$isReduced$unreduced$identity$comp.unreduced(value);
      done = true;
    }

    if (err || done || item === void 0) {
      value = stepper[tResult](value);
      done = true;
    }

    // notify if done
    if (done) {
      if (continuation) {
        continuation(err, value);
        continuation = null;
        value = null;
      } else if (err) {
        value = null;
        throw err;
      }
    }

    return done;
  }

  return function (err, item) {
    if (!checkDone(err, item)) {
      try {
        // step to next result.
        value = stepper[tStep](value, item);
        checkDone(err, item);
      } catch (err2) {
        checkDone(err2, item);
      }
    }
    if (done) return value;
  };
}

function emitInto(to, t, from) {
  var cb;
  t = _Transducer$protocols$isReduced$unreduced$identity$comp.compose(t, emitData(to));
  cb = callback(t, null, continuation);
  from.on('data', onData);
  from.once('error', onError);
  from.once('end', onEnd);

  function continuation(err) {
    if (err) to.emit('error', err);
    to.emit('end');
  }

  function onData(item) {
    cb(null, item);
  }

  function onError(err) {
    cb(err);
  }

  function onEnd() {
    cb();
    removeListeners();
  }

  function removeListeners() {
    from.removeListener(onData).removeListener(onError).removeListener(onEnd);
  }

  return to;
}

var emitData = function emitData(emitter) {
  return function (xf) {
    return new EmitData(emitter, xf);
  };
};

var EmitData = (function (_Transducer) {
  function EmitData(emitter, xf) {
    _classCallCheck(this, EmitData);

    _Transducer.call(this, xf);
    this.emitter = emitter;
  }

  _inherits(EmitData, _Transducer);

  EmitData.prototype[tStep] = function (value, input) {
    this.emitter.emit('data', input);
    return value;
  };

  return EmitData;
})(_Transducer$protocols$isReduced$unreduced$identity$comp.Transducer);
//# sourceMappingURL=async.js.map
},{"5":5,"6":6,"7":7}],3:[function(require,module,exports){
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

exports.__esModule = true;

var _Transducer$reduced$protocols = require(7);

"use strict";
var _protocols$transducer = _Transducer$reduced$protocols.protocols.transducer;
var tStep = _protocols$transducer.step;
var tResult = _protocols$transducer.result;
var gen = function gen(stepper, completer) {
  return function (xf) {
    return new Gen(stepper, completer, xf);
  };
};
exports.gen = gen;

var Gen = (function (_Transducer) {
  function Gen(stepper, completer, xf) {
    _classCallCheck(this, Gen);

    _Transducer.call(this, xf);
    this.stepper = new Stepper(stepper, xf);
    this.completer = completer;
  }

  _inherits(Gen, _Transducer);

  Gen.prototype[tStep] = function (value, input) {
    return this.stepper.step(value, input);
  };

  Gen.prototype[tResult] = function (value) {
    if (this.completer) {
      this.completer(this.stepper._step);
    }
    return this.xfResult(value);
  };

  return Gen;
})(_Transducer$reduced$protocols.Transducer);

var Stepper = (function () {
  function Stepper(generator, xf) {
    var _this = this;

    _classCallCheck(this, Stepper);

    this.xf = xf;
    this._step = function (input) {
      _this.value = _this.xf[tStep](_this.value, input);
    };
    this.gen = generator(this._step);
  }

  Stepper.prototype.step = function step(value, input) {
    var next = this.next,
        gen = this.gen;
    this.value = value;
    if (next === void 0) {
      next = gen.next();
    }
    if (!next.done) {
      next = gen.next(input);
    }
    this.next = next;
    if (next.done) {
      return _Transducer$reduced$protocols.reduced(this.value);
    }
    return this.value;
  };

  return Stepper;
})();
//# sourceMappingURL=gen.js.map
},{"7":7}],4:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;

var _import = require(2);

var async = _interopRequireWildcard(_import);

var _gen = require(3);

exports.async = async;
exports.gen = _gen.gen;
//# sourceMappingURL=index.js.map
},{"2":2,"3":3}],5:[function(require,module,exports){
module.exports = Promise;

},{}],6:[function(require,module,exports){
'use strict';

var _lastValue;

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;

// given a reduce implementation, returns a transduce implementation
// that delegates to the implementation after handling multiple arity
// and dynamic argument types
exports.transduceImpl = transduceImpl;

// given a reduce implementation, returns a reduce implementation
// that delegates to reduce after handling multiple arity
// and dynamic argument types
exports.reduceImpl = reduceImpl;

// given a reduce implementation, returns an into implementation
// that delegates to reduce after handling currying, multiple arity
// and dynamic argument types
exports.intoImpl = intoImpl;
exports.iterator = iterator;
exports.iterable = iterable;
exports.transformer = transformer;

var _protocols$isReduced$unreduced$identity$isArray$isFunction$isString = require(7);

var _protocols$transducer = _protocols$isReduced$unreduced$identity$isArray$isFunction$isString.protocols.transducer;
var tInit = _protocols$transducer.init;
var tStep = _protocols$transducer.step;
var tResult = _protocols$transducer.result;

var symIter = _protocols$isReduced$unreduced$identity$isArray$isFunction$isString.protocols.iterator;
function transduceImpl(reduce) {
  return function transduce(t, xf, init, coll) {
    if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isFunction(xf)) {
      xf = completing(xf);
    }
    xf = t(xf);
    if (arguments.length === 3) {
      coll = init;
      init = xf[tInit]();
    }
    return reduce(xf, init, coll);
  };
}

function reduceImpl(_reduce) {
  return function reduce(xf, init, coll) {
    if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isFunction(xf)) {
      xf = completing(xf);
    }
    if (arguments.length === 2) {
      coll = init;
      init = xf[tInit]();
    }
    return _reduce(xf, init, coll);
  };
}

function intoImpl(reduce) {
  return function into(init, t, coll) {
    var xf = transformer(init),
        len = arguments.length;

    if (len === 1) {
      return intoCurryXf(xf);
    }

    if (len === 2) {
      if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isFunction(t)) {
        return intoCurryXfT(xf, t);
      }
      coll = t;
      return reduce(xf, init, coll);
    }
    return reduce(t(xf), init, coll);
  };

  function intoCurryXf(xf) {
    return function intoXf(t, coll) {
      if (arguments.length === 1) {
        if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isFunction(t)) {
          return intoCurryXfT(xf, t);
        }
        coll = t;
        return reduce(xf, xf[tInit](), coll);
      }
      return reduce(t(xf), xf[tInit](), coll);
    };
  }

  function intoCurryXfT(xf, t) {
    return function intoXfT(coll) {
      return reduce(t(xf), xf[tInit](), coll);
    };
  }
}

// Turns a step function into a transfomer with init, step, result
// If init not provided, calls `step()`.  If result not provided, calls `idenity`
var completing = function completing(rf, result) {
  return new Completing(rf, result);
};
exports.completing = completing;
function Completing(rf, result) {
  this[tInit] = rf;
  this[tStep] = rf;
  this[tResult] = result || _protocols$isReduced$unreduced$identity$isArray$isFunction$isString.identity;
}

// Convert a value to an iterable
var has = ({}).hasOwnProperty;

function iterator(value) {
  return iterable(value)[symIter]();
}

function iterable(value) {
  var it;
  if (value[symIter] !== void 0) {
    it = value;
  } else if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isArray(value) || _protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isString(value)) {
    it = new ArrayIterable(value);
  } else if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isFunction(value)) {
    it = new FunctionIterable(function () {
      return { done: false, value: value() };
    });
  } else if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isFunction(value.next)) {
    it = new FunctionIterable(function () {
      return value.next();
    });
  } else {
    it = new ObjectIterable(value);
  }
  return it;
}

var ArrayIterable = (function () {
  function ArrayIterable(arr) {
    _classCallCheck(this, ArrayIterable);

    this.arr = arr;
  }

  ArrayIterable.prototype[symIter] = function () {
    var _this = this;

    var idx = 0;
    return {
      next: function next() {
        if (idx >= _this.arr.length) {
          return { done: true };
        }
        return { done: false, value: _this.arr[idx++] };
      }
    };
  };

  return ArrayIterable;
})();

exports.ArrayIterable = ArrayIterable;

var FunctionIterable = (function () {
  function FunctionIterable(fn) {
    _classCallCheck(this, FunctionIterable);

    this.fn = fn;
  }

  FunctionIterable.prototype[symIter] = function () {
    return { next: this.fn };
  };

  return FunctionIterable;
})();

exports.FunctionIterable = FunctionIterable;

var ObjectIterable = (function () {
  function ObjectIterable(obj) {
    _classCallCheck(this, ObjectIterable);

    this.obj = obj;
    this.keys = Object.keys(obj);
  }

  ObjectIterable.prototype[symIter] = function () {
    var _this2 = this;

    var idx = 0;
    return {
      next: function next() {
        if (idx >= _this2.keys.length) {
          return { done: true };
        }
        var key = _this2.keys[idx++];
        return { done: false, value: [key, _this2.obj[key]] };
      }
    };
  };

  return ObjectIterable;
})();

exports.ObjectIterable = ObjectIterable;

// converts a value to a transformer
var slice = Array.prototype.slice;

var lastValue = (_lastValue = {}, _lastValue[tInit] = function () {}, _lastValue[tStep] = function (result, input) {
  return input;
}, _lastValue[tResult] = _protocols$isReduced$unreduced$identity$isArray$isFunction$isString.identity, _lastValue);

function transformer(value) {
  var xf;
  if (value === void 0 || value === null) {
    xf = lastValue;
  } else if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isFunction(value[tStep])) {
    xf = value;
  } else if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isFunction(value)) {
    xf = completing(value);
  } else if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isArray(value)) {
    xf = new ArrayTransformer(value);
  } else if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isString(value)) {
    xf = new StringTransformer(value);
  } else {
    xf = new ObjectTransformer(value);
  }
  return xf;
}

// Pushes value on array, using optional constructor arg as default, or [] if not provided
// init will clone the default
// step will push input onto array and return result
// result is identity

var ArrayTransformer = (function () {
  function ArrayTransformer(defaultValue) {
    _classCallCheck(this, ArrayTransformer);

    this.defaultValue = defaultValue === void 0 ? [] : defaultValue;
  }

  ArrayTransformer.prototype[tInit] = function () {
    return slice.call(this.defaultValue);
  };

  ArrayTransformer.prototype[tStep] = function (result, input) {
    result.push(input);
    return result;
  };

  ArrayTransformer.prototype[tResult] = function (value) {
    return value;
  };

  return ArrayTransformer;
})();

exports.ArrayTransformer = ArrayTransformer;

// Appends value onto string, using optional constructor arg as default, or '' if not provided
// init will return the default
// step will append input onto string and return result
// result is identity

var StringTransformer = (function () {
  function StringTransformer(str) {
    _classCallCheck(this, StringTransformer);

    this.strDefault = str === void 0 ? '' : str;
  }

  StringTransformer.prototype[tInit] = function () {
    return this.strDefault;
  };

  StringTransformer.prototype[tStep] = function (result, input) {
    return result + input;
  };

  StringTransformer.prototype[tResult] = function (value) {
    return value;
  };

  return StringTransformer;
})();

exports.StringTransformer = StringTransformer;

// Merges value into object, using optional constructor arg as default, or {} if undefined
// init will clone the default
// step will merge input into object and return result
// result is identity

var ObjectTransformer = (function () {
  function ObjectTransformer(obj) {
    _classCallCheck(this, ObjectTransformer);

    this.objDefault = obj === void 0 ? {} : objectMerge({}, obj);
  }

  ObjectTransformer.prototype[tInit] = function () {
    return objectMerge({}, this.objDefault);
  };

  ObjectTransformer.prototype[tResult] = function (value) {
    return value;
  };

  return ObjectTransformer;
})();

exports.ObjectTransformer = ObjectTransformer;

ObjectTransformer.prototype[tStep] = objectMerge;
function objectMerge(result, input) {
  if (_protocols$isReduced$unreduced$identity$isArray$isFunction$isString.isArray(input) && input.length === 2) {
    result[input[0]] = input[1];
  } else {
    var prop;
    for (prop in input) {
      if (has.call(input, prop)) {
        result[prop] = input[prop];
      }
    }
  }
  return result;
}
//# sourceMappingURL=_internal.js.map
},{"7":7}],7:[function(require,module,exports){
'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;
exports.isIterable = isIterable;
exports.isIterator = isIterator;
exports.compose = compose;
exports.reduced = reduced;
exports.unreduced = unreduced;
var toString = Object.prototype.toString;
var has = ({}).hasOwnProperty;

// type checks
var isArray = Array.isArray || predicateToString('Array');
exports.isArray = isArray;
var isFunction = function isFunction(value) {
  return typeof value === 'function';
};
exports.isFunction = isFunction;
var isUndefined = function isUndefined(value) {
  return value === void 0;
};
exports.isUndefined = isUndefined;
var isNumber = predicateToString('Number');
exports.isNumber = isNumber;
var isRegExp = predicateToString('RegExp');
exports.isRegExp = isRegExp;
var isString = predicateToString('String');
exports.isString = isString;
function predicateToString(type) {
  var str = '[object ' + type + ']';
  return function (value) {
    return str === toString.call(value);
  };
}

function isIterable(value) {
  return !!(isString(value) || isArray(value) || value && value[protocols.iterator]);
}

function isIterator(value) {
  return !!(value && isFunction(value.next));
}

// convenience functions
var identity = function identity(v) {
  return v;
};

exports.identity = identity;

function compose() {
  var fns = arguments;
  return function (xf) {
    var i = fns.length;
    while (i--) {
      xf = fns[i](xf);
    }
    return xf;
  };
}

// protocol symbols for iterators and transducers
var symbolExists = typeof Symbol !== 'undefined';
var protocols = {
  iterator: symbolExists ? Symbol.iterator : '@@iterator',
  transducer: {
    init: '@@transducer/init',
    step: '@@transducer/step',
    result: '@@transducer/result',
    reduce: '@@transducer/reduce',
    reduced: '@@transducer/reduced',
    value: '@@transducer/value'
  }
};

exports.protocols = protocols;
// reduced wrapper object
var _protocols$transducer = protocols.transducer;
var tValue = _protocols$transducer.value;
var tReduced = _protocols$transducer.reduced;
var isReduced = function isReduced(value) {
  return !!(value && value[tReduced]);
};

exports.isReduced = isReduced;

function reduced(value, force) {
  if (force || !isReduced(value)) {
    value = new Reduced(value);
  }
  return value;
}

function Reduced(value) {
  this[tValue] = value;
  this[tReduced] = true;
}

function unreduced(value) {
  if (isReduced(value)) {
    value = value[tValue];
  }
  return value;
}

// Base class for transducers with default implementation
// delegating to wrapped transformer, xf
var _protocols$transducer2 = protocols.transducer;
var tInit = _protocols$transducer2.init;
var tStep = _protocols$transducer2.step;
var tResult = _protocols$transducer2.result;

var Transducer = (function () {
  function Transducer(xf) {
    _classCallCheck(this, Transducer);

    this.xf = xf;
  }

  Transducer.prototype[tInit] = function () {
    return this.xfInit();
  };

  Transducer.prototype.xfInit = function xfInit() {
    return this.xf[tInit]();
  };

  Transducer.prototype[tStep] = function (value, input) {
    return this.xfStep(value, input);
  };

  Transducer.prototype.xfStep = function xfStep(value, input) {
    return this.xf[tStep](value, input);
  };

  Transducer.prototype[tResult] = function (value) {
    return this.xfResult(value);
  };

  Transducer.prototype.xfResult = function xfResult(value) {
    return this.xf[tResult](value);
  };

  return Transducer;
})();

exports.Transducer = Transducer;
//# sourceMappingURL=util.js.map
},{}]},{},[1])(1)
});