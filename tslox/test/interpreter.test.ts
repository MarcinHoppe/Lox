import { hadRuntimeError } from "../src/error";
import { interpret } from "./common";

type TestCase = {
  name: string,
  source: string,
  output: string | string[],
  skip?: boolean
}

type ErrorTestCase = {
  name: string,
  source: string,
  error: string,
  skip?: boolean
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("interpreter", () => {
  const testCases: TestCase[] = [
    {
      name: "print literal",
      source: "print 1;",
      output: "1"
    },
    {
      name: "print minus literal",
      source: "print -1;",
      output: "-1"
    },
    {
      name: "print bang boolean literal",
      source: "print !true; print !false;",
      output: ["false", "true"]
    },
    {
      name: "treat number as truthy",
      source: "print !1;print !0;",
      output: ["false", "false"]
    },
    {
      name: "treat string as truthy",
      source: `print !"";print !"string";`,
      output: ["false", "false"]
    },
    {
      name: "treat nil as falsy",
      source: `print !nil;`,
      output: "true"
    },
    {
      name: "greater",
      source: `print 1 > 2; print 2 > 1; print 2 > 2;`,
      output: ["false", "true", "false"]
    },
    {
      name: "greater equal",
      source: `print 1 >= 2; print 2 >= 1; print 2 >= 2;`,
      output: ["false", "true", "true"]
    },
    {
      name: "less",
      source: `print 1 < 2; print 2 < 1; print 2 < 2;`,
      output: ["true", "false", "false"]
    },
    {
      name: "less equal",
      source: `print 1 <= 2; print 2 <= 1; print 2 <= 2;`,
      output: ["true", "false", "true"]
    },
    {
      name: "equal equal number",
      source: `print 1 == 2; print 1 == 1;`,
      output: ["false", "true"]
    },
    {
      name: "equal equal string",
      source: `print "1" == "2"; print "1" == "1";`,
      output: ["false", "true"]
    },
    {
      name: "equal equal bool",
      source: `print true == false; print true == true;`,
      output: ["false", "true"]
    },
    {
      name: "equal equal nil",
      source: `print nil == 2; print nil == nil;`,
      output: ["false", "true"]
    },
    {
      name: "bang equal number",
      source: `print 1 != 2; print 1 != 1;`,
      output: ["true", "false"]
    },
    {
      name: "bang equal string",
      source: `print "1" != "2"; print "1" != "1";`,
      output: ["true", "false"]
    },
    {
      name: "bang equal bool",
      source: `print true != false; print true != true;`,
      output: ["true", "false"]
    },
    {
      name: "bang equal nil",
      source: `print nil != 2; print nil != nil;`,
      output: ["true", "false"]
    },
    {
      name: "minus",
      source: `print 1-2; print 2-1;`,
      output: ["-1", "1"]
    },
    {
      name: "star",
      source: `print 2*3; print 2*0;`,
      output: ["6", "0"]
    },
    {
      name: "slash",
      source: `print 6/2; print 1/2;`,
      output: ["3", "0.5"]
    },
    {
      name: "plus numbers",
      source: `print 1+2; print 2+0;`,
      output: ["3", "2"]
    },
    {
      name: "plus strings",
      source: `print "1"+"2"; print "foo"+"bar";`,
      output: ["12", "foobar"]
    },
    {
      name: "or",
      source: `print true or false; print false or false;`,
      output: ["true", "false"]
    },
    {
      name: "or return left expression if truthy",
      source: `print 1 or false; print "string" or false;`,
      output: ["1", "string"]
    },
    {
      name: "or return right expression if left is falsy",
      source: `print false or 2; print nil or "string";`,
      output: ["2", "string"]
    },
    {
      name: "and",
      source: `print false and true; print true and true;`,
      output: ["false", "true"]
    },
    {
      name: "and return left expression if falsy",
      source: `print false and 1; print nil and true;`,
      output: ["false", "nil"]
    },
    {
      name: "and return right expression if left is truthy",
      source: `print true and "2"; print "string" and "bar";`,
      output: ["2", "bar"]
    },
    {
      name: "var without initializer",
      source: `var i; print i;`,
      output: "nil"
    },
    {
      name: "var with initializer",
      source: `var i = 2; print i;`,
      output: "2"
    },
    {
      name: "assign",
      source: `var i = 2; print i; i = 3; print i;`,
      output: ["2", "3"]
    },
    {
      name: "assign return value",
      source: `var i = 2; print i; var j = i = 3; print j; print i;`,
      output: ["2", "3", "3"],
    },
    {
      name: "grouping",
      source: `var j = 2*1+1; var k = 2*(1+1); print j; print k;`,
      output: ["3", "4"],
    },
    {
      name: "if executes then when condition is true",
      source: `var c = true; if (c) print "then"; print "end";`,
      output: ["then", "end"],
    },
    {
      name: "if does not execute then when condition is false",
      source: `var c = false; if (c) print "then"; print "end";`,
      output: ["end"],
    },
    {
      name: "if executes else when condition is false",
      source: `var c = false; if (c) print "then"; else print "else"; print "end";`,
      output: ["else", "end"],
    },
    {
      name: "if does not execute ese when condition is true",
      source: `var c = true; if (c) print "then"; else print "else"; print "end";`,
      output: ["then", "end"],
    },
    {
      name: "while executed until condition is false",
      source: `var i = 0; while (i < 5) print i = i + 1; print i;`,
      output: ["1", "2", "3", "4", "5", "5"],
    },
    {
      name: "block",
      source: `{ var i = 1; print i; }`,
      output: ["1"],
    },
    {
      name: "block creates new environment",
      source: `
        var a = "global";
        {
          var a = "outer";
          {
            var a = "inner";
            print a;
          }
          print a;
        }
        print a;
      `,
      output: ["inner", "outer", "global"],
    },
    {
      name: "function without params",
      source: `
        fun f() {
          print 12;
        }
        f();
      `,
      output: "12",
    },
    {
      name: "function with params",
      source: `
        fun f(a, b) {
          print a + b;
        }
        f("foo", "bar");
      `,
      output: "foobar",
    },
    {
      name: "function with params that are expressions",
      source: `
        fun f(a, b) {
          print a + b;
        }
        f(1+2, 3*2);
      `,
      output: "9",
    },
    {
      name: "function as expression",
      source: `
        fun a() { print "a"; }
        fun b() { print "b"; }
        var c = true;
        var f;
        if (c) {
          f = a;
        } else {
          f = b;
        }
        f();
      `,
      output: "a"
    },
    {
      name: "return without value",
      source: `
        fun f() { print "start"; return; print "end"; }
        print f();
      `,
      output: ["start", "nil"]
    },
    {
      name: "return with value",
      source: `
        fun f() { print "start"; return 3; print "a"; }
        print f();
      `,
      output: ["start", "3"],
    },
    {
      name: "create class instance",
      source: `
        class A { }
        var a = A();
        print a;
      `,
      output: "A instance",
    },
    {
      name: "get and set fields on class instance",
      source: `
        class A { }
        var a = A();
        a.field = 12;
        print a.field;
      `,
      output: "12",
    },
    {
      name: "field set returns value",
      source: `
        class A { }
        var a = A();
        a.field = 12;
        print a.field = 13;
      `,
      output: "13",
    },
    {
      name: "define and call method",
      source: `
        class A {
          method() {
            print "A::method";
          }
        }
        var a = A();
        a.method();
      `,
      output: "A::method",
    },
    {
      name: "methods have access to the current instance (this)",
      source: `
        class A {
          method() {
            print this.field;
          }
        }
        var a = A();
        a.field = 12;
        print a.field;
        a.method();
      `,
      output: ["12", "12"]
    },
    {
      name: "classes have initializers",
      source: `
        class A {
          init() {
            print "A";
            this.field = 12;
          }
        }
        var a = A();
        print a.field;
      `,
      output: ["A", "12"]
    },
    {
      name: "initializers return this",
      source: `
        class A {
          init() {
            print "A";
            return;
            print "B";
          }
        }
        var a = A();
        print a.init();
        class B {
          init() {
            print "C";
          }
        }
        var b = B();
        print b.init();
      `,
      output: ["A", "A", "A instance", "C", "C", "B instance"]
    },
    {
      name: "methods from superclass are available in subclass",
      source: `
        class S {
          method() { print "S"; }
        }
        class A < S { }
        var a = A();
        a.method();
      `,
      output: "S"
    },
    {
      name: "subclass can access superclass members (super)",
      source: `
        class S {
          init() {
            print "S::init";
          }
          method() {
            print "S::method";
          }
        }
        class A < S {
          init() {
            super.init();
            print "A::init";
          }
          method() {
            super.method();
          }
        }
        var a = A();
        a.method();
      `,
      output: ["S::init", "A::init", "S::method"]
    }
  ];

  for (const tc of testCases) {
    if (tc.skip) {
      it.skip(tc.name, () => {});
      continue;
    }
    it(tc.name, () => {
      const logSpy = jest.spyOn(console, "log");

      interpret(tc.source);

      let outputs: string[];
      if (typeof tc.output === "string") {
        outputs = [tc.output];
      } else {
        outputs = [...tc.output];
      }

      expect(logSpy).toHaveBeenCalledTimes(outputs.length);
      for (let i = 0; i < outputs.length; i++) {
        expect(logSpy).toHaveBeenNthCalledWith(i+1, outputs[i]);
      }
    });
  }

  describe("report error", () => {
    const testCases: ErrorTestCase[] = [
      {
        name: "unary evaluation checks that operand is number",
        source: "print -false;",
        error: `Operand must be a number.
[line 1]`
      },
      {
        name: "less checks that left operand is a number",
        source: "print true < 1;",
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "less checks that right operand is a number",
        source: "print 1 < true;",
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "greater checks that left operand is a number",
        source: "print true > 1;",
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "greater checks that right operand is a number",
        source: "print 1 > true;",
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "greater equal checks that left operand is a number",
        source: "print nil >= 1;",
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "greater equal checks that right operand is a number",
        source: "print 1 >= nil;",
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "less equal checks that left operand is a number",
        source: `print "foo" <= 1;`,
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "less equal checks that right operand is a number",
        source: `print 1 <= "foo";`,
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "minus checks that left operand is a number",
        source: `print "foo"-1;`,
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "minus checks that right operand is a number",
        source: `print 1-"foo";`,
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "star checks that left operand is a number",
        source: `print "foo"*1;`,
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "star checks that right operand is a number",
        source: `print 1*"foo";`,
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "slash checks that left operand is a number",
        source: `print "foo"/1;`,
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "slash that right operand is a number",
        source: `print 1/"foo";`,
        error: `Operands must be numbers.
[line 1]`
      },
      {
        name: "plus checks that both operands are numbers or strings",
        source: `print 1+"foo";`,
        error: `Operands must be two numbers or two strings.
[line 1]`
      },
      {
        name: "can only call function",
        source: `var c = "foo"; c();`,
        error: `Can only call functions and classes.
[line 1]`
      },
      {
        name: "must provide all arguments",
        source: `fun f(a, b) {} f(1);`,
        error: `Expected 2 arguments but got 1.
[line 1]`,
      },
      {
        name: "only instances have properties when getting",
        source: `var a = 1; print a.field;`,
        error: `Only instances have properties.
[line 1]`,
      },
      {
        name: "only instances have properties when setting",
        source: `var a = 1; a.field = 2;`,
        error: `Only instances have properties.
[line 1]`,
      },
      {
        name: "superclass must be a class",
        source: `
          fun f() { }
          class A < f { }
        `,
        error: `Superclass must be a class.
[line 3]`
      },
      {
        name: "must handle missing method on superclass",
        source: `
          class S { }
          class A < S {
            method() {
              print super.field;
            }
          }
          var a = A();
          a.method();
        `,
        error: `Undefined property 'field'.
[line 5]`
      }
    ];

    for (const tc of testCases) {
      if (tc.skip) {
        it.skip(tc.name, () => {});
        continue;
      }
      it(tc.name, () => {
        const errorSpy = jest.spyOn(console, "error");
  
        interpret(tc.source);
  
        expect(errorSpy).toHaveBeenCalledWith(tc.error);
        expect(hadRuntimeError()).toBe(true);
      });
    }
  });
});
