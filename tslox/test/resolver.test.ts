import { hadError } from '../src/error';
import { ResolveLocal, Resolver } from '../src/resolver';

import { parse } from './common';

type TestCase = {
  name: string,
  source: string,
  output: string
}

type ErrorTestCase = {
  name: string,
  source: string,
  error: string
}

type TestCaseGroup<TCase> = {
  [group: string]: TCase[]
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("resolver", () => {
  const groups: TestCaseGroup<TestCase> = {
    "global scope": [
      {
        name: "no resolutions in global scope",
        source: `var i;`,
        output: ``
      }
    ],
    "block": [
      {
        name: "block creates scope",
        source: `{ var i; i = 1; }`,
        output: `Assign:0`
      },
      {
        name: "nested block creates scope",
        source: `{ var i; { i = 1; } }`,
        output: `Assign:1`
      },
      {
        name: "nested blocks",
        source: `{ { var i; { i = 1; } } }`,
        output: `Assign:1`
      },
      {
        name: "shadowing variables",
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
        output: `Variable:0 Variable:0`
      },
    ],
    "class": [
      {
        name: "declaration",
        source: `{
          class A { }
          var a = A();
        }`,
        output: `Variable:0`
      },
      {
        name: "this",
        source: `{
          class A {
            init() {
              this.field = "value";
            }
          }
          var a = A();
        }`,
        output: `This:1 Variable:0`
      },
      {
        name: "super",
        source: `{
          class B {
            method() { }
          }

          class A < B {
            anotherMethod() {
              super.method();
            }
          }
          var a = A();
        }`,
        output: `Variable:0 Super:2 Variable:0`
      },
      {
        name: "get field",
        source: `
          class A {
            init() {
              this.field = 0;
            }

            f() {
              return this.field;
            }

            fp() {
              return +this.field;
            }

            fm() {
              return -this.field;
            }
          }

          var a = A();
          print a.field;
          print a.f();
          print a.fp();
          print a.fm();
        `,
        output: `This:1 This:1 This:1`
      }
    ],
    "function": [
      {
        name: "params in scope",
        source: `
          {
            fun f(a, b) {
              print a;
              print b;
            }

            {
              f(1, 2);
            }
          }
        `,
        output: `Variable:0 Variable:0 Variable:1`
      },
      {
        name: "return",
        source: `
          {
            fun f(a, b) {
              return (a + b);
            }

            {
              f(1, 2);
            }
          }
        `,
        output: `Variable:0 Variable:0 Variable:1`
      }
    ],
    "if": [
      {
        name: "resolve condition and then branch",
        source: `
          {
            var i = 1;
            if (i == 1) {
              i = 2;
            }
          }
        `,
        output: `Variable:0 Assign:1`
      },
      {
        name: "resolve else branch",
        source: `
          {
            var i = 1;
            if (i == 1) {
              i = 2;
            } else {
              i = 3;
            }
          }
        `,
        output: `Variable:0 Assign:1 Assign:1`
      },
      {
        name: "logical conditions",
        source: `
          {
            var i = 1;
            var j = 2;
            if ((i == j) or (j != i)) {
              print i;
            } else if ((i == 0) and (j == 0)) {
              print "zero!";
            } else {
              print "impossible!";
            }
          }
        `,
        output: `Variable:0 Variable:0 Variable:0 Variable:0 Variable:1 Variable:0 Variable:0`
      }
    ],
    "while": [
      {
        name: "resolve condition and body",
        source: `
          {
            var a = 7;
            while (a >= 0) {
              a = a - 1;
            }
          }
        `,
        output: "Variable:0 Variable:1 Assign:1"
      }
    ]
  };

  for (const [group, cases] of Object.entries(groups)) {
    describe(group, () => {
      for (const c of cases) {
        it(c.name, () => {
          const trace: string[] = [];
          const traceResolveFn: ResolveLocal = (expr, depth) => {
            trace.push(`${expr.kind}:${depth}`);
          };

          const resolver = new Resolver(traceResolveFn);

          const statements = parse(c.source);
          resolver.resolve(statements);

          expect(trace.join(" ")).toStrictEqual(c.output);
        });
      }
    });
  }

  describe("report error", () => {
    const errorGroups: TestCaseGroup<ErrorTestCase> = {
      "variables": [
        {
          name: "duplicate variable",
          source: `{ var i; var i; }`,
          error: "[1] Error at 'i': There already is a variable with this name in this scope."
        },
        {
          name: "cannot read local var in its initializer",
          source: `{ var i = i + 1; }`,
          error: "[1] Error at 'i': Can't read local variable in its own initializer"
        }
      ],
      "class": [
        {
          name: "cannot inherit from itself",
          source: `class D < D { }`,
          error: "[1] Error at 'D': A class can't inherit from itself."
        },
        {
          name: "cannot use this outside of a class",
          source: `print this;`,
          error: "[1] Error at 'this': Can't use 'this' outside of a class."
        },
        {
          name: "cannot use super outside of a class",
          source: `print super.field;`,
          error: "[1] Error at 'super': Can't use 'super' outside of a class."
        },
        {
          name: "cannot use super in a class without superclass",
          source: `class D { f() { return super.field; } }`,
          error: "[1] Error at 'super': Can't use 'super' in a class no superclass."
        }
      ],
      "return": [
        {
          name: "cannot return from top level code",
          source: `return 1;`,
          error: "[1] Error at 'return': Can't return from top-level code."
        },
        {
          name: "cannot return from initializer",
          source: `
            class A {
              init() {
                return 1;
              }
            }
          `,
          error: "[4] Error at 'return': Can't return from an initializer."
        }
      ]
    };

    for (const [group, cases] of Object.entries(errorGroups)) {
      describe(group, () => {
        for (const c of cases) {
          it(c.name, () => {
            const errorSpy = jest.spyOn(console, "error");
            
            const traceResolveFn: ResolveLocal = (expr, depth) => { };

            const resolver = new Resolver(traceResolveFn);

            const statements = parse(c.source);
            resolver.resolve(statements);

            expect(errorSpy).toHaveBeenCalledWith(c.error);
            expect(hadError()).toBe(true);
          });
        }
      });
    };
  });
});
