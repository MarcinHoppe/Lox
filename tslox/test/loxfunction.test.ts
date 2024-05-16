import Environment from "../src/environment";
import Interpreter from "../src/interpreter";
import LoxFunction from "../src/loxfunction";
import { Resolver } from "../src/resolver";
import { ClassDecl, Function } from "../src/stmt";
import { parse } from "./common";

describe("function", () => {
  it("reports arity as number of parameters", () => {
    const statements = parse(`fun foo(a, b) {}`);
    const declaration = statements[0] as Function;

    const env = new Environment();
    const fn = new LoxFunction(declaration, env, false);

    expect(fn.arity).toStrictEqual(2);
  });
  it("reports function name", () => {
    const statements = parse(`fun foo() {}`);
    const declaration = statements[0] as Function;

    const env = new Environment();
    const fn = new LoxFunction(declaration, env, false);

    expect(fn.toString()).toStrictEqual(`<fn foo>`);
  });
  describe("call", () => {
    it("executes statements in new environments", () => {
      const statements = parse(`fun f(a,b) { print a+b; }`);
      const declaration = statements[0] as Function;

      const interpreter = new Interpreter();
      const resolver = new Resolver((expr, depth) => interpreter.resolve(expr, depth));

      resolver.resolve(statements);

      const env = new Environment();
      const fn = new LoxFunction(declaration, env, false);
  
      const logSpy = jest.spyOn(console, 'log');

      const retVal = fn.call(interpreter, [1, 2]);

      expect(retVal).toBeNull();
      expect(logSpy).toHaveBeenCalledWith("3");
    });
  });
});
