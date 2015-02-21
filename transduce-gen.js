"use strict";
module.exports = gen;
function gen(stepper, completer) {
  return function(xf){
    return new Gen(stepper, completer, xf);
  };
}
function Gen(stepper, completer, xf) {
  this.xf = xf;
  this.stepper = new Stepper(stepper, xf);
  this.completer = completer;
}
Gen.prototype.init = function(){
  return this.xf.init();
};
Gen.prototype.result = function(result){
  if(this.completer){
    this.completer(this.stepper._step);
  }
  return this.xf.result(result);
};
Gen.prototype.step = function(result, input) {
  return this.stepper.step(result, input);
};

function Stepper(generator, xf){
  this.xf = xf;
  this._step = step(this);
  this.gen = generator(this._step);
}
Stepper.prototype.step = function(result, input){
  var next = this.next,
      gen = this.gen;
  this.result = result;
  if(next === void 0){
    next = gen.next();
  }
  if(!next.done){
    next = gen.next(input);
  }
  this.next = next;
  if(next.done){
    return {value: this.result, __transducers_reduced__: true};
  }
  return this.result;
};
function step(stepper){
  return function(input){
    stepper.result = stepper.xf.step(stepper.result, input);
  };
}
