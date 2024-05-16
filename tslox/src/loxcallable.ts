import Interpreter from "./interpreter";

export interface LoxCallable {
  readonly arity: number;
  call(interpreter: Interpreter, args: unknown[]): unknown;
}

export function isLoxCallable(o: any): o is LoxCallable {
  return typeof o.arity === "number" && typeof o.call === "function";
}
