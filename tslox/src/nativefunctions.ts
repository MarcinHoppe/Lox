import Interpreter from "./interpreter";
import { LoxCallable } from "./loxcallable";

export class ClockFunction implements LoxCallable {
  arity = 0;

  call(interpreter: Interpreter, args: unknown[]): unknown {
    return Date.now();
  }

  toString = () => "<native fn>";
}
