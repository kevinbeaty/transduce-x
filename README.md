## Transduce Gen
[![Build Status](https://secure.travis-ci.org/transduce/transduce-gen.svg)](http://travis-ci.org/transduce/transduce-gen)

Create Transducers using ES6 Generators.  Generator is created with a step function and each item in transformation is yielded through the generator.  Calling step function will step value to next transformer in the pipeline.  An optional completing function can be provided that will be called on transformer result.

Works with [transduce][5], [transducers-js][3] or [transducers.js][4].

Requires support for ES6 generators.  If using Node.js run with `node --harmony` and version 0.11 or better.

### Examples

Mapping transducer loops infinitely and transforms each yieled item with mapping function.

#### Map
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

#### Filter

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

#### Take

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

#### Push

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

[3]: https://github.com/cognitect-labs/transducers-js
[4]: https://github.com/jlongster/transducers.js
[5]: https://github.com/transduce/transduce
