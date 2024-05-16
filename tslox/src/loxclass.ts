import Interpreter from "./interpreter";
import { LoxCallable } from "./loxcallable";
import LoxFunction from "./loxfunction";
import { LoxInstance } from "./loxinstance";

export class LoxClass implements LoxCallable {
  constructor(
    private readonly name: string,
    private readonly methods: Map<string, LoxFunction>,
    private readonly superclass?: LoxClass,
  ) { }

  findMethod(name: string): LoxFunction | undefined {
    if (this.methods.has(name)) {
      return this.methods.get(name);
    }
    if (this.superclass) {
      return this.superclass.findMethod(name);
    }
    return undefined;
  }

  arity: number = 0;
  
  call(interpreter: Interpreter, args: unknown[]): unknown {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod("init");
    if (initializer) {
      initializer.bind(instance).call(interpreter, args);
    }
    return instance;
  }

  toString = () => this.name;
}

export function isLoxClass(o: any): o is LoxClass {
  return typeof o === "object"
    && "findMethod" in o
    && typeof o.findMethod === "function"
    && "arity" in o
    && typeof o.arity === "number"
    && "call" in o
    && typeof o.call === "function";
}
