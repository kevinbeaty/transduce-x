"use strict";
var gen = require('../'), 
    test = require('tape'),
    tr = require('transduce'),
    comp = tr.compose,
    slice = Array.prototype.slice;

test('map', function(t){
  t.plan(3);

  function map(f){
    return gen(function*(step){
      while(true){
        step(f(yield 0));
      }
    });
  }

  var doubled = map(function(num){ return num * 2; });
  var result = tr.toArray(doubled, [1,2,3]);
  t.deepEqual([2,4,6], result, 'can double');

  var tripled = map(function(num){ return num * 3; });
  result = tr.toArray(tripled, [1,2,3]);
  t.deepEqual([3,6,9], result, 'can triple');

  doubled = comp(
    map(function(num){ return num * 2; }),
    map(function(num){ return num * 3; }));
  result = tr.toArray(doubled, [1,2,3]);
  t.deepEqual([6,12,18], result, 'can double and triple in chain value');
});

test('filter', function(t){
  t.plan(1);

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
  var result = tr.toArray(filter(isEven), evenArray);
  t.deepEqual([2, 4, 6], result, 'can filter even');
});

test('take', function(t) {
  t.plan(5);

  function take(n){
    return gen(function*(step){
      var i = 0;
      for(; i < n; i++){
        step(yield 0);
      }
    });
  }

  t.deepEqual(tr.toArray(take(0), [1, 2, 3]), [], 'can pass an index to first');
  t.deepEqual(tr.toArray(take(1), [1, 2, 3]), [1], 'can pull out the first element of an array');
  t.deepEqual(tr.toArray(take(2), [1, 2, 3]), [1, 2], 'can pass an index to first');
  t.deepEqual(tr.toArray(take(3), [1, 2, 3]), [1, 2, 3], 'can pass an index to first');
  t.strictEqual(tr.toArray(take(-1), [1, 2, 3]).length, 0);
});

test('drop', function(t) {
  t.plan(4);

  function drop(n){
    return gen(function*(step){
      var i = 0;
      for(; i < n; i++){
        yield 0;
      }

      while(true){
        step(yield 0);
      }
    });
  }
  var numbers = [1, 2, 3, 4];
  t.deepEqual(tr.toArray(drop(1), numbers), [2, 3, 4], 'working rest()');
  t.deepEqual(tr.toArray(drop(0), numbers), [1, 2, 3, 4], 'working rest(0)');
  t.deepEqual(tr.toArray(drop(-1), numbers), [1, 2, 3, 4], 'working rest(-1)');
  t.deepEqual(tr.toArray(drop(2), numbers), [3, 4], 'rest can take an index');
});

test('push unshift', function(t) {
  t.plan(6);

  function unshift(){
    var args = slice.call(arguments);
    return gen(function*(step){
      args.forEach(step);

      while(true){
        step(yield 0);
      }
    });
  }

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

  t.deepEqual(tr.toArray(push(4,5,6), [1,2,3]), [1,2,3,4,5,6]);
  t.deepEqual(tr.toArray(comp(push(4), push(5,6)), [1,2,3]), [1,2,3,4,5,6]);

  t.deepEqual(tr.toArray(unshift(4, 5, 6), [1,2,3]), [4,5,6,1,2,3]);
  t.deepEqual(tr.toArray(comp(unshift(4), unshift(5, 6)), [1,2,3]), [5,6,4,1,2,3]);

  t.deepEqual(tr.toArray(comp(push(4), unshift(5, 6)), [1,2,3]), [5,6,1,2,3,4]);
  t.deepEqual(tr.toArray(comp(unshift(4), push(5, 6)), [1,2,3]), [4,1,2,3,5,6]);
});
