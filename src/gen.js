"use strict"
import {Transducer, reduced, protocols} from 'transduce/lib/util'

const {step: tStep, result: tResult} = protocols.transducer

export const gen = (stepper, completer) => xf => new Gen(stepper, completer, xf)
class Gen extends Transducer {
  constructor(stepper, completer, xf) {
    super(xf)
    this.stepper = new Stepper(stepper, xf)
    this.completer = completer
  }
  [tStep](value, input) {
    return this.stepper.step(value, input)
  }
  [tResult](value){
    if(this.completer){
      this.completer(this.stepper._step)
    }
    return this.xfResult(value)
  }
}

class Stepper {
  constructor(generator, xf){
    this.xf = xf
    this._step =  (input) => {this.value = this.xf[tStep](this.value, input)}
    this.gen = generator(this._step)
  }
  step(value, input){
    var next = this.next,
        gen = this.gen
    this.value = value
    if(next === void 0){
      next = gen.next()
    }
    if(!next.done){
      next = gen.next(input)
    }
    this.next = next
    if(next.done){
      return reduced(this.value)
    }
    return this.value
  }
}
