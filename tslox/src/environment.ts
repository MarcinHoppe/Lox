import RuntimeError from "./runtimeerror";
import { Token } from "./token";

export default class Environment {
  private values = new Map<string, unknown>();

  constructor(public enclosing?: Environment) { }

  define(name: string, value: unknown) {
    this.values.set(name, value);
  }
  
  get(name: Token): unknown {
    if (this.values.has(name.lexeme)) {    
      return this.values.get(name.lexeme);
    }
    if (this.enclosing) {
      return this.enclosing.get(name);
    }
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'`);
  }

  private ancestor(distance: number) {
    let environment: Environment | undefined = this;
    for (let i = 0; i < distance; i++) {
      environment = environment?.enclosing;
    }
    return environment;
  }

  getAt(distance: number, name: string) {
    const ancestor = this.ancestor(distance)!;
    return ancestor.values.get(name);
  }

  assign(name: Token, value: unknown) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }
    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'`);
  }

  assignAt(distance: number, name: Token, value: unknown) {
    const ancestor = this.ancestor(distance)!;
    ancestor.values.set(name.lexeme, value);
  }
}
