import { LoxClass } from "../src/loxclass";
import { LoxInstance } from "../src/loxinstance";
import RuntimeError from "../src/runtimeerror";
import { Token } from "../src/token";

describe("lox instance", () => {
  describe("fields", () => {
    it("get and set", () => {
      const klass = new LoxClass("A", new Map());
      const obj = new LoxInstance(klass);
      const name = new Token("Identifier", 1, "field");
      
      obj.set(name, 12);
      expect(obj.get(name)).toStrictEqual(12);
    });
    it("report error on undefined property", () => {
      const klass = new LoxClass("A", new Map());
      const obj = new LoxInstance(klass);
      const name = new Token("Identifier", 1, "field");
      
      expect(() => obj.get(name)).toThrow(new RuntimeError(name, "Undefined property field."));
    });
  });
  it("report as class instance", () => {
    const klass = new LoxClass("A", new Map());
    const instance = new LoxInstance(klass);
    expect(instance.toString()).toStrictEqual("A instance");
  });
});
