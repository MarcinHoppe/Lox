import Environment from '../src/environment';
import RuntimeError from '../src/runtimeerror';
import { Token } from '../src/token';

describe("environment", () => {
  describe("simple", () => {
    it("define", () => {
      const env = new Environment();
      env.define("variable", 1);

      const value = env.get(new Token("Identifier", 1, "variable"));
      expect(value).toStrictEqual(1);
    });
    it("assign", () => {
      const env = new Environment();
      env.define("variable", 1);

      const variable = new Token("Identifier", 1, "variable");

      let value = env.get(variable);
      expect(value).toStrictEqual(1);

      env.assign(variable, 2);

      value = env.get(variable);
      expect(value).toStrictEqual(2);
    });
    it("handle nil", () => {
      const env = new Environment();
      env.define("variable", null);

      let value = env.get(new Token("Identifier", 1, "variable"));
      expect(value).toBeNull();
    });
    describe("throw", () => {
      it("when getting undefined variable", () => {
        const env = new Environment();
  
        const variable = new Token("Identifier", 1, "variable");
        const err = new RuntimeError(variable, "Undefined variable 'variable'");
  
        expect(() => env.get(variable)).toThrow(err);
      });
      it("when assigning to undefined variable", () => {
        const env = new Environment();
  
        const variable = new Token("Identifier", 1, "variable");
        const err = new RuntimeError(variable, "Undefined variable 'variable'");
  
        expect(() => env.assign(variable, 1)).toThrow(err);
      });
    });
  });
  describe("enclosing", () => {
    it("get from enclosing env", () => {
      const rootEnv = new Environment();
      rootEnv.define("variable", 1);
      const env = new Environment(rootEnv);

      const value = env.get(new Token("Identifier", 1, "variable"));
      expect(value).toStrictEqual(1);
    });
    it("assign in enclosing env", () => {
      const rootEnv = new Environment();
      rootEnv.define("variable", 1);
      const env = new Environment(rootEnv);

      const variable = new Token("Identifier", 1, "variable");

      let value = env.get(variable);
      expect(value).toStrictEqual(1);

      env.assign(variable, 2);
      
      value = env.get(variable);
      expect(value).toStrictEqual(2);
    });
    it("shadow", () => {
      const rootEnv = new Environment();
      rootEnv.define("variable", 1);
      const env = new Environment(rootEnv);

      const variable = new Token("Identifier", 1, "variable");

      let value = env.get(variable);
      expect(value).toStrictEqual(1);

      env.define("variable", 2);
      
      value = env.get(variable);
      expect(value).toStrictEqual(2);
    });
    describe("hierarchy", () => {
      it("get from 2 levels up", () => {
        let env = new Environment();
        env.define("variable", 1);

        env = new Environment(env);
        env.define("variable", 2);

        env = new Environment(env);
        env.define("variable", 3);

        expect(env.getAt(0, "variable")).toStrictEqual(3);
        expect(env.getAt(1, "variable")).toStrictEqual(2);
        expect(env.getAt(2, "variable")).toStrictEqual(1);
      });
      it("assign at 2 levels up", () => {
        let env = new Environment();
        env.define("variable", 1);

        env = new Environment(env);
        env.define("variable", 2);

        env = new Environment(env);
        env.define("variable", 3);

        expect(env.getAt(0, "variable")).toStrictEqual(3);
        expect(env.getAt(1, "variable")).toStrictEqual(2);
        expect(env.getAt(2, "variable")).toStrictEqual(1);

        const variable = new Token("Identifier", 1, "variable");

        env.assignAt(0, variable, 33);
        expect(env.getAt(0, "variable")).toStrictEqual(33);
        expect(env.getAt(1, "variable")).toStrictEqual(2);
        expect(env.getAt(2, "variable")).toStrictEqual(1);

        env.assignAt(1, variable, 22);
        expect(env.getAt(0, "variable")).toStrictEqual(33);
        expect(env.getAt(1, "variable")).toStrictEqual(22);
        expect(env.getAt(2, "variable")).toStrictEqual(1);

        env.assignAt(2, variable, 11);
        expect(env.getAt(0, "variable")).toStrictEqual(33);
        expect(env.getAt(1, "variable")).toStrictEqual(22);
        expect(env.getAt(2, "variable")).toStrictEqual(11);
      });
    });
  });
});