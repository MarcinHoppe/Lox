import { LoxClass } from "./loxclass";
import RuntimeError from "./runtimeerror";
import { Token } from "./token";

export class LoxInstance {
  private readonly fields = new Map<string, unknown>();
  
  constructor(private readonly klass: LoxClass) { }

  get(name: Token) {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme);
    }

    const method = this.klass.findMethod(name.lexeme);
    if (method) {
      return method.bind(this);
    }

    throw new RuntimeError(name, `Undefined property ${name.lexeme}.`);
  }

  set(name: Token, value: unknown) {
    this.fields.set(name.lexeme, value);
  }

  toString = () => `${this.klass} instance`;
}

export function isLoxInstance(o: any): o is LoxInstance {
  return typeof o === "object"
    && "get" in o
    && typeof o.get === "function"
    && "set" in o
    && typeof o.set === "function";
}
