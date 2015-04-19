'use strict'
var async = require('../async'),
    tr = require('transduce'),
    tp = tr.protocols.transducer,
    test = require('tape'),
    Prom = require('any-promise')

function resolve(value){
  return new Prom(function(resolve){
    resolve(value)
  })
}

function add(x){
  return function(y){
    return x+y
  }
}

function deferAdd(x){
  return function(y){
    return resolve(x+y)
  }
}

function isEven(x){
  return +x == x && (x % 2 === 0)
}

function inc(x){
  return x+1
}


test('reduce', function(t) {
  t.plan(5)

  var sum = async.reduce(function(sum, num){ return sum + num }, 0, [1,2,3])
  sum.then(function(value){
    t.equal(value, 6, 'can sum up an array')
  })

  var prod = async.reduce(function(prod, num){ return prod * num }, 1, [1, 2, 3, 4])
  prod.then(function(value){
    t.equal(value, 24, 'can reduce via multiplication')
  })

  sum = async.reduce(function(sum, num){ return sum + num }, 0, [resolve(1),2,3])
  sum.then(function(value){
    t.equal(value, 6, 'can sum up an array')
  })

  prod = async.reduce(function(prod, num){ return prod * num }, 1, [1, 2, resolve(3), resolve(4)])
  prod.then(function(value){
    t.equal(value, 24, 'can reduce via multiplication')
  })

  prod = async.reduce(function(prod, num){ return prod * num }, resolve(2), resolve([1, 2, resolve(3), 4]))
  prod.then(function(value){
    t.equal(value, 48, 'can reduce via multiplication')
  })
})

test('transduce', function(t) {
  t.plan(5)

  var plus1 = tr.map(add(1))

  var sum = async.transduce(plus1, function(sum, num){ return sum + num }, 0, [1,2,3])
  sum.then(function(value){
    t.equal(value, 9, 'can sum up an array')
  })

  var prod = async.transduce(plus1, function(prod, num){ return prod * num }, 1, [1, 2, 3, 4])
  prod.then(function(value){
    t.equal(value, 120, 'can reduce via multiplication')
  })

  sum = async.transduce(plus1, function(sum, num){ return sum + num }, 0, [resolve(1),2,3])
  sum.then(function(value){
    t.equal(value, 9, 'can sum up an array')
  })

  prod = async.transduce(plus1, function(prod, num){ return prod * num }, 1, [1, 2, resolve(3), resolve(4)])
  prod.then(function(value){
    t.equal(value, 120, 'can reduce via multiplication')
  })

  prod = async.transduce(plus1, function(prod, num){ return prod * num }, resolve(2), resolve([1, 2, resolve(3), 4]))
  prod.then(function(value){
    t.equal(value, 240, 'can reduce via multiplication')
  })
})

test('into array', function(t) {
  t.plan(7)

  var toArray = async.into([])

  var arr = toArray([1,2,3])
  arr.then(function(value){
    t.deepEqual(value, [1,2,3])
  })

  var add1 = toArray(tr.map(add(1)), [1,2,3])
  add1.then(function(value){
    t.deepEqual(value, [2,3,4])
  })

  var add3 = toArray(tr.compose(tr.map(add(1)), tr.map(add(2))), [1,2,3])
  add3.then(function(value){
    t.deepEqual(value, [4,5,6])
  })

  add3 = toArray(tr.compose(tr.map(deferAdd(1)), async.defer(), tr.map(add(2))), [1,2,3])
  add3.then(function(value){
    t.deepEqual(value, [4,5,6])
  })

  add3 = toArray(async.compose(tr.map(deferAdd(1)), tr.map(deferAdd(2))), [1,2,3])
  add3.then(function(value){
    t.deepEqual(value, [4,5,6])
  })

  add1 = toArray(tr.map(add(1)), [1,resolve(2),3])
  add1.then(function(value){
    t.deepEqual(value, [2,3,4])
  })

  add1 = toArray(tr.map(add(1)), resolve([1,resolve(2),3]))
  add1.then(function(value){
    t.deepEqual(value, [2,3,4])
  })
})

test('delay', function(t) {
  t.plan(7)
  var items, trans
  trans = async.compose(tr.map(deferAdd(1)), async.delay(10), tr.tap(checkItem))

  async.into([], trans, [1,2,3])
    .then(function(result){
      t.deepEqual(result, [2,3,4])
    })

  var prevTime = +new Date(),
      expected = [2,3,4]
  function checkItem(result, item){
    var currTime = +new Date()
    t.ok(currTime > prevTime + 3, 'delay '+item)
    t.equal(expected.shift(), item, 'in order '+item)
    prevTime = currTime
  }
})

test('deferred transformer', function(t) {
  t.plan(7)

  var xf = {}
  xf[tp.init] = function(){
    return resolve([])
  }
  xf[tp.step] = function(arr, item){
    arr.push(item)
    return resolve(arr)
  }
  xf[tp.result] = function(arr){
    return resolve(arr)
  }

  var arr = async.reduce(xf, [1,2,3])
  arr.then(function(value){
    t.deepEqual(value, [1,2,3])
  })

  var add1 = async.transduce(tr.map(add(1)), xf, [1,2,3])
  add1.then(function(value){
    t.deepEqual(value, [2,3,4])
  })

  var add3 = async.transduce(tr.compose(tr.map(add(1)), tr.map(add(2))), xf, [1,2,3])
  add3.then(function(value){
    t.deepEqual(value, [4,5,6])
  })

  add3 = async.transduce(tr.compose(tr.map(deferAdd(1)), async.defer(), tr.map(add(2))), xf, [1,2,3])
  add3.then(function(value){
    t.deepEqual(value, [4,5,6])
  })

  add3 = async.transduce(async.compose(tr.map(deferAdd(1)), tr.map(deferAdd(2))), xf, [1,2,3])
  add3.then(function(value){
    t.deepEqual(value, [4,5,6])
  })

  add1 = async.transduce(tr.map(add(1)), xf, [1,resolve(2),3])
  add1.then(function(value){
    t.deepEqual(value, [2,3,4])
  })

  add1 = async.transduce(tr.map(add(1)), xf, resolve([1,resolve(2),3]))
  add1.then(function(value){
    t.deepEqual(value, [2,3,4])
  })
})

test('callback result', function(t){
  var results = [],
      trans = tr.compose(tr.filter(isEven), tr.map(inc), tr.take(2), tr.tap(appendEach)),
      cb = async.callback(trans)

  ;[1,1,2,3,4,4,5].forEach(cb.bind(null, null))
  t.deepEqual(results, [3,5])
  t.equal(5, cb())

  trans = tr.compose(tr.filter(isEven), tr.map(inc), tr.tap(appendEach))
  cb = async.callback(trans)
  results = []
  ;[1,2,3,4,5,6,7,8,9].forEach(cb.bind(null, null))
  t.deepEqual(results, [3,5,7,9])

  function appendEach(result, item){
    results.push(item)
  }

  t.end()
})

test('callback continuation', function(t){
  t.plan(9)

  var results, result, trans, cb, abort = new Error('abort')

  trans = tr.compose(tr.filter(isEven), tr.map(inc), tr.take(2), tr.tap(appendEach))
  cb = async.callback(trans, null, continuation)

  results = []
  result = {done: false, error: false}

  ;[1,1,2,3,4,4,5].forEach(function(item){cb(null, item)})
  t.deepEqual(results, [3,5])
  t.deepEqual(result, {done:true, error:null})

  cb = tr.compose(tr.filter(isEven), tr.map(inc), tr.tap(appendEach), tr.take(2))
  cb = async.callback(trans, null, continuation)

  results = []
  result = {done: false, error: false}

  ;[1,1,2,3,4,4,5].forEach(function(item){cb(item === 3 ? abort : null, item)})
  t.deepEqual(results, [3])
  t.deepEqual(result, {done:true, error:abort})

  results = []
  result = {done: false, error: false}

  trans = tr.compose(tr.filter(isEven), tr.map(inc), tr.tap(appendEach))
  cb = async.callback(trans, null, continuation)
  ;[1,2,3,4,5,6,7,8,9].forEach(function(item){cb(null, item)})
  t.deepEqual(results, [3,5,7,9])
  t.deepEqual(result, {done:false, error:false})
  cb()
  t.deepEqual(result, {done:true, error:null})

  results = []
  result = {done: false, error: false}

  trans = tr.compose(
    tr.filter(isEven),
    tr.map(inc),
    tr.tap(appendEach),
    tr.tap(function(result, i){if(i===7){throw abort}}))
  cb = async.callback(trans, null, continuation)
  ;[1,2,3,4,5,6,7,8,9].forEach(function(item){cb(null, item)})
  t.deepEqual(results, [3,5,7])
  t.deepEqual(result, {done:true, error:abort})

  function appendEach(result, item){
    results.push(item)
  }

  function continuation(err){
    result.done = true
    result.error = err
  }
})

test('when', function(t) {
  t.plan(5)
  async.when(1, tr.map(add(1)))
    .then(function(value){
      t.equals(2, value)
    })
  async.when(resolve(1), tr.map(add(1)))
    .then(function(value){
      t.equals(2, value)
    })
  async.when(resolve(1), tr.compose(tr.map(deferAdd(1)), async.defer()))
    .then(function(value){
      t.equals(2, value)
    })
  async.when(deferAdd(2)(3), tr.compose(tr.map(add(2)), tr.map(add(1))))
    .then(function(value){
      t.equals(8, value)
    })
  async.when(deferAdd(2)(3), async.compose(tr.map(deferAdd(2)), tr.map(deferAdd(1))))
    .then(function(value){
      t.equals(8, value)
    })
})

test('promiseTransform', function(t) {
  t.plan(2)
  resolve(1)
    .then(async.promiseTransform(tr.map(add(1))))
    .then(function(value){
      t.equals(2, value)
    })
  resolve(1)
    .then(async.promiseTransform(tr.compose(tr.map(add(2)), tr.map(add(1)))))
    .then(function(value){
      t.equals(4, value)
    })
})

test('emitInto', function(t){
  var EventEmitter = require('events').EventEmitter,
      from = new EventEmitter(),
      items = [],
      error = null,
      end = false,
      trans = tr.compose(tr.filter(isEven), tr.map(inc), tr.take(2)),
      to = async.emitInto(new EventEmitter(), trans, from),
      cb = function(item){
        from.emit('data', item);
      }

  to.on('data', pushItem)
  to.on('error', storeError)
  to.on('end', storeEnd)

  ;[1,1,2,3,4,4,5].forEach(cb)
  t.deepEqual(items, [3,5])
  t.equal(end, true)
  t.equal(error, null)

  from = new EventEmitter()
  end = false

  to = async.emitInto(new EventEmitter(), trans, from)
  to.on('data', pushItem)
  to.on('error', storeError)
  to.on('end', storeEnd)

  var err = new Error()
  from.emit('error', err)
  t.equal(end, true)
  t.equal(error, err)

  function pushItem(item){
    items.push(item)
  }

  function storeError(err){
    error = err
  }

  function storeEnd(){
    end = true
  }

  t.end()
})
