import Interpreter from "../src/interpreter";
import { isLoxCallable } from "../src/loxcallable";
import { LoxClass } from "../src/loxclass";
import { LoxInstance } from "../src/loxinstance";

describe("lox class", () => {
  describe("no initializer", () => {
    it("can be called without arguments", () => {
      const klass = new LoxClass("A", new Map());
      expect(isLoxCallable(klass)).toStrictEqual(true);
      expect(klass.arity).toStrictEqual(0);
    });
    it("call creates instance", () => {
      const klass = new LoxClass("A", new Map());

      const obj = klass.call(new Interpreter(), []);
      expect(obj).not.toBeNull();
      expect(obj).toBeInstanceOf(LoxInstance);
    });
  });
  it("report as class name", () => {
    const klass = new LoxClass("A", new Map());
    expect(klass.toString()).toStrictEqual("A");
  });
});
