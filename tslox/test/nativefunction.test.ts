import Interpreter from '../src/interpreter';
import { ClockFunction } from '../src/nativefunctions';

describe("native function", () => {
  describe("clock", () => {
    it("takes 0 arguments", () => {
      const fn = new ClockFunction();
      expect(fn.arity).toBe(0);
    });
    it("reports as native fn", () => {
      const fn = new ClockFunction();
      expect(fn.toString()).toStrictEqual("<native fn>");
    });
    it("returns current time", () => {
      const now = jest.now();

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const fn = new ClockFunction();
      expect(fn.call(new Interpreter(), [])).toStrictEqual(now);
    });
  });
});
