import { Function } from './stmt';
import Environment from './environment';
import { LoxCallable } from './loxcallable';
import Interpreter from './interpreter';
import ReturnException from './return';
import { LoxInstance } from './loxinstance';

export default class LoxFunction implements LoxCallable {
  constructor(
    private readonly declaration: Function,
    private readonly closure: Environment,
    private readonly isInitializer: boolean
  ) {
    this.arity = this.declaration.params.length;
  }

  bind(instance: LoxInstance) {
    const env = new Environment(this.closure);
    env.define("this", instance);
    return new LoxFunction(this.declaration, env, this.isInitializer);
  }

  readonly arity: number;

  call(interpreter: Interpreter, args: unknown[]): unknown {
    const env = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      env.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, env);
    } catch (e) {
      if (e instanceof ReturnException) {
        if (this.isInitializer) {
          return this.closure.getAt(0, "this");
        }

        return e.value;
      }
      throw e;
    }

    if (this.isInitializer) {
      return this.closure.getAt(0, "this");
    }
    
    return null;
  }

  toString = () => `<fn ${this.declaration.name.lexeme}>`;
}
