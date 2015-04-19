# Transduce-X
[![Build Status](https://secure.travis-ci.org/kevinbeaty/transduce-x.svg)](http://travis-ci.org/kevinbeaty/transduce-x)

Experimental extensions to [transduce](https://github.com/transduce/transduce).

### Install and Usage

```bash
$ npm install transduce-x
```

If using async package, also install a Promise library of your choice.  Works with [any-promise](https://github.com/kevinbeaty/any-promise) library (a pollyfill, es6-promise, promise, native-promise-only, bluebird, rsvp, when, q).  Just install the Promise library preference and it will be auto detected and used.

#### Browser

* [Development](https://raw.githubusercontent.com/kevinbeaty/transduce-x/master/build/transduce-x.js)
* [Minified](https://raw.githubusercontent.com/kevinbeaty/transduce-x/master/build/transduce-x.min.js)

### API

Supports the following functions:

```javascript
async {
  defer: function()
  delay: function(wait)
  compose: function(/*args*/)
  into: function(init, t?, coll?)
  transduce: function(t, xf, init?, coll)
  reduce: function(xf, init?, coll)
  when: function(promiseOrValue, t)
  promiseTransform: function(t)
  emitInto: function(to, t, from)
  callback: function(t, init?, continuation?)
}
gen: function(stepGenerator, resultFn?)
```

#### Async
Use Transducers with async iterators and observables by supporting Promises in iterators and transformers. Inspired by [this talk](http://channel9.msdn.com/Events/Lang-NEXT/Lang-NEXT-2014/Keynote-Duality) from Erik Meijer.

Mixed into `transduce.async` or available by explictly requiring from `transduce/async`.  The following are equivalent:

- `require('transduce').async.defer`
- `require('transduce/async').defer`

##### async.defer()
Create a deferred transducer that allows wrapped transformer to `step` or `result` a Promise in addition to a value. All items will be queued and processed in order. The wrapped transformer is called with value of resolved Promise.

##### async.delay(wait)
Create a deferred transducer that delays step of wrapped transformer by `wait` milliseconds. All items will be queued and delayed and `step` will return a promise that will resolve after `wait` milliseconds for each item.

##### async.compose(/\*fns\*/)
Like a normal compose, except all arguments are interleaved with `defer`.  This allows any transducer in composed pipeline to `step` or `result` a Promise in addition to a value.  The wrapped transformer is called with value of resolved Promise.

##### async.transduce(t, xf, init?, coll)
Like a normal transduce, except `init` and `coll` can be a Promise and `xf` can be a deferred transducer. The value of `coll` can be anything that can be converted to an iterator. The return value is a Promise for the result of the transformation.

##### async.reduce(xf, init?, coll)
Like a normal reduce, except `init` and `coll` can be a Promise and `xf` can be a deferred transducer. The value of `coll` can be anything that can be converted to an iterator. The return value is a Promise for the result of the reduction.

##### async.into(init, t?, coll?)
Async version of into. Returns a Promise for a new collection appending all items into `init` by passing all items from source collection `coll` through the optional transducer `t`.  Chooses transformer, `xf` from type of `init`.  Can be array, object, string or have `@@transformer`. `coll` is converted to an `iterator`.

The function is automatically curried. If `coll` is not provided, returns a curried function using `transformer` from `init` and the same transformation can be used for multiple collections.

##### async.when(promiseOrValue, t)
Resolves promise or value as a promise, then transforms promise result with the transducer `t` as a single item.

##### async.promiseTransform(t)
Creates a callback useable for promise sucess that transforms the result with the transducer `t`as a single item.

##### async.emitInto(to, t, from)
Registers listener for events on `from` emitter and emits events on `to` emitter after transforming data events through the transducer, `t`. Assumes both `to` and `from` support the `EventEmitter` API from Node.js.

Supports following events:

- `emit('data', item)`: Listened and emitted for each item in transformation.
- `emit('error', error)`: Listened and emitted on error in transformation
- `emit('end')`: Emitted when transformer completes, regardless of error or result.

##### async.callback(t, init?, continuation?)
Creates an async callback that starts a transducer process and accepts parameter `cb(err, item)` as a new item in the process. The returned callback and the optional continuation follow Node.js conventions with  `fn(err, item)`. Each item advances the state  of the transducer, if the continuation is provided, it will be called on completion or error. An error will terminate the transducer and be propagated to the continuation.

If the transducer exhausts due to early termination, all subsequent calls to the callback will no-op and return the computed result. If the callback is called with no item, the transducer terminates, and all subsequent calls will no-op and return the computed result. The callback returns `undefined` until completion. Once completed, the final `result` is always returned.

Like `into`, chooses transformer, `xf`, based on the type of `init` using `transformer`.  If `init` is not defined, maintains last value and does not buffer results. This can be used with `tap` or other methods to process items incrementally instead of waiting and buffering results.

##### Gen

Create Transducers using ES6 Generators.  Generator is created with a step function and each item in transformation is yielded through the generator.  Calling step function will step value to next transformer in the pipeline.  An optional completing function can be provided that will be called on transformer result.

Works with [transduce][5], [transducers-js][3] or [transducers.js][4].

Requires support for ES6 generators.  If using Node.js run with `node --harmony` and version 0.11 or better.


Mapping transducer loops infinitely and transforms each yieled item with mapping function.

```javascript
var gen = require('transduce-gen');
function map(f){
  return gen(function*(step){
    while(true){
      step(f(yield 0));
    }
  });
}

var doubled = map(function(num){ return num * 2; });
tr.into([], doubled, [1,2,3]);
// [2,4,6]
```

Filter only calls `step` if it passes a predicate.

```javascript
var gen = require('transduce-gen');
function filter(p){
  return gen(function*(step){
    while(true){
      var val = yield 0;
      if(p(val)){
        step(val);
      }
    }
  });
}
function isEven(x){
  return x%2 === 0;
}
var evenArray = [1, 2, 3, 4, 5, 6];
tr.into([], filter(isEven), evenArray);
// [2,4,6]
```

Early termination (reduced) can be signalled by completing generator function.

```javascript
var gen = require('transduce-gen');
function take(n){
  return gen(function*(step){
    var i = 0;
    for(; i < n; i++){
      step(yield 0);
    }
  });
}

tr.into([], take(2), [1, 2, 3]))
// [1, 2]
```

Provide optional completing function to be called on result.

```javascript
var gen = require('transduce-gen');
function push(){
  var args = slice.call(arguments);
  return gen(function*(step){
    while(true){
        step(yield 0);
    }
  },
  function(step){
    args.forEach(step);
  });
}
tr.into([], comp(push(4), push(5,6)), [1,2,3]))
// [1,2,3,4,5,6]
```

### License
MIT
