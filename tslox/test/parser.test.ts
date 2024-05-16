import { Token } from "../src/token";
import { hadError } from "../src/error";

import { parse } from './common';

afterEach(() => {
  jest.restoreAllMocks();
});

describe("parser", () => {
  it("parses empty token list", () => {
    const statements = parse("");
    expect(statements).toHaveLength(0);
  });
  describe("declaration", () => {
    describe("class", () => {
      it("empty", () => {
        const statements = parse("class A {}")

        expect(statements).toEqual([
          {
            kind: "ClassDecl",
            name: new Token("Identifier", 1, "A"),
            superclass: null,
            methods: []
          }
        ]);
      });
      it("one empty method", () => {
        const source = 
          `class A {
            method() { }
          }`;
        const statements = parse(source);

        expect(statements).toEqual([
          {
            kind: "ClassDecl",
            name: new Token("Identifier", 1, "A"),
            superclass: null,
            methods: [
              {
                kind: "Function",
                name: new Token("Identifier", 2, "method"),
                params: [],
                body: []
              }
            ]
          }
        ]);
      });
      it("one method with params and body", () => {
        const source = 
          `class A {
            method(a, b) {
              print a + b;
            }
          }`;
        const statements = parse(source);

        expect(statements).toEqual([
          {
            kind: "ClassDecl",
            name: new Token("Identifier", 1, "A"),
            superclass: null,
            methods: [
              {
                kind: "Function",
                name: new Token("Identifier", 2, "method"),
                params: [
                  new Token("Identifier", 2, "a"),
                  new Token("Identifier", 2, "b")
                ],
                body: [
                  {
                    kind: "Print",
                    expression: {
                      kind: "Binary",
                      operator: new Token("Plus", 3, "+"),
                      left: {
                        kind: "Variable",
                        name: new Token("Identifier", 3, "a")
                      },
                      right: {
                        kind: "Variable",
                        name: new Token("Identifier", 3, "b")
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]);
      });
      it("multiple methods", () => {
        const source = 
          `class A {
            method() { }
            anotherMethod() { }
          }`;
        const statements = parse(source);

        expect(statements).toEqual([
          {
            kind: "ClassDecl",
            name: new Token("Identifier", 1, "A"),
            superclass: null,
            methods: [
              {
                kind: "Function",
                name: new Token("Identifier", 2, "method"),
                params: [],
                body: []
              },
              {
                kind: "Function",
                name: new Token("Identifier", 3, "anotherMethod"),
                params: [],
                body: []
              }
            ]
          }
        ]);
      });
      it("with superclass", () => {
        const statements = parse(`class A < S { }`);

        expect(statements).toEqual([
          {
            kind: "ClassDecl",
            name: new Token("Identifier", 1, "A"),
            superclass: {
              kind: "Variable",
              name: new Token("Identifier", 1, "S")
            },
            methods: []
          }
        ]);
      });
      describe("report error", () => {
        it("on missing class name", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`class {}`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '{': Expect class name.`);
          expect(hadError()).toBe(true);
        });
        it("on missing superclass name", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`class A < {}`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '{': Expect superclass name.`);
          expect(hadError()).toBe(true);
        });
        it("on missing left brace", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`class A method () {} }`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'method': Expect '{' before class body.`);
          expect(hadError()).toBe(true);
        });
        it("on missing right brace", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`class A { method () {}`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at end: Expect '}' after class body.`);
          expect(hadError()).toBe(true);
        });
      });
    });
    describe("fun", () => {
      it("empty", () => {
        const statements = parse("fun f() {}")

        expect(statements).toEqual([
          {
            kind: "Function",
            name: new Token("Identifier", 1, "f"),
            params: [],
            body: []
          },
        ]);
      });
      it("no parameters", () => {
        const statements = parse("fun f() { print 1; }")

        expect(statements).toEqual([
          {
            kind: "Function",
            name: new Token("Identifier", 1, "f"),
            params: [],
            body: [
              {
                kind: "Print",
                expression: {
                  kind: "Literal",
                  value: 1
                }
              }
            ]
          },
        ]);
      });
      it("one parameter", () => {
        const statements = parse("fun f(p) { print 1; }")

        expect(statements).toEqual([
          {
            kind: "Function",
            name: new Token("Identifier", 1, "f"),
            params: [
              new Token("Identifier", 1, "p")
            ],
            body: [
              {
                kind: "Print",
                expression: {
                  kind: "Literal",
                  value: 1
                }
              }
            ]
          },
        ]);
      });
      it("multiple parameters", () => {
        const statements = parse("fun f(a, b, c) { print 1; }")

        expect(statements).toEqual([
          {
            kind: "Function",
            name: new Token("Identifier", 1, "f"),
            params: [
              new Token("Identifier", 1, "a"),
              new Token("Identifier", 1, "b"),
              new Token("Identifier", 1, "c")
            ],
            body: [
              {
                kind: "Print",
                expression: {
                  kind: "Literal",
                  value: 1
                }
              }
            ]
          },
        ]);
      });
      describe("report error", () => {
        it("on missing name", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`fun () {print 1;}`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '(': Expect function name.`);
          expect(hadError()).toBe(true);
        });
        it("on missing left paren", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`fun f) {print 1;}`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at ')': Expect '(' after function name.`);
          expect(hadError()).toBe(true);
        });
        it("on missing right paren", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`fun f(a {print 1;}`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '{': Expect ')' after function parameters.`);
          expect(hadError()).toBe(true);
        });
        it("on missing left brace", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`fun f(a) print 1;}`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'print': Expect '{' before function body.`);
          expect(hadError()).toBe(true);
        });
        it("on missing parameter name", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`fun f(a,) {print 1;}`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at ')': Expect parameter name.`);
          expect(hadError()).toBe(true);
        });
        it("on unexpected parameter token", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`fun f(a,1) {print 1;}`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '1': Expect parameter name.`);
          expect(hadError()).toBe(true);
        });
        it("on more than 255 parameters", () => {
          const errorSpy = jest.spyOn(console, "error");

          let source = `fun f(a`;
          for (let i = 0; i < 255; i++) {
            source += `,a`;
          }
          source += `) { print 1; }`;
          parse(source);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'a': Can't have more than 255 parameters.`);
          expect(hadError()).toBe(true);
        });
      });
    });
    describe("var", () => {
      it("name and initializer", () => {
        const statements = parse("var a = 1;")

        expect(statements).toEqual([
          {
            kind: "Var",
            name: new Token("Identifier", 1, "a"),
            initializer: {
              kind: "Literal",
              value: 1
            }
          },
        ]);
      });
      it("no initializer", () => {
        const statements = parse("var a;")

        expect(statements).toEqual([
          {
            kind: "Var",
            name: new Token("Identifier", 1, "a"),
            initializer: null
          },
        ]);
      });
      describe("report error", () => {
        it("on missing variable name", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`var = 1;`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '=': Expect variable name.`);
          expect(hadError()).toBe(true);
        });
        it("on semicolon", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`var a = true`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at end: Expect ';' after variable declaration.`);
          expect(hadError()).toBe(true);
        });
      });
    });
    describe("statements", () => {
      it("report error for missing semicolon after statement", () => {
        const errorSpy = jest.spyOn(console, "error");

        const statements = parse("1");
        expect(statements).toHaveLength(0);

        expect(errorSpy).toHaveBeenCalledWith("[1] Error at end: Expect ';' after expression.");
        expect(hadError()).toBe(true);
      });
      it("report error after synchronization", () => {
        const errorSpy = jest.spyOn(console, "error");

        const statements = parse(`1 "foo"`);
        expect(statements).toHaveLength(0);

        expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '"foo"': Expect ';' after expression.`);
        expect(hadError()).toBe(true);
      });
      describe("for", () => {
        it("full form", () => {
          const statements = parse("for (i = 1; i < 2; i = i + 1) print i;")

          expect(statements).toEqual([
            {
              kind: "Block",
              statements: [
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Assign",
                    name: new Token("Identifier", 1, "i"),
                    right: {
                      kind: "Literal",
                      value: 1
                    }
                  }
                },
                {
                  kind: "While",
                  condition: {
                    kind: "Binary",
                    operator: new Token("Less", 1, "<"),
                    left: {
                      kind: "Variable",
                      name: new Token("Identifier", 1, "i")
                    },
                    right: {
                      kind: "Literal",
                      value: 2
                    }
                  },
                  body: {
                    kind: "Block",
                    statements: [
                      {
                        kind: "Print",
                        expression: {
                          kind: "Variable",
                          name: new Token("Identifier", 1, "i")
                        }
                      },
                      {
                        kind: "ExpressionStmt",
                        expression: {
                          kind: "Assign",
                          name: new Token("Identifier", 1, "i"),
                          right: {
                            kind: "Binary",
                            operator: new Token("Plus", 1, "+"),
                            left: {
                              kind: "Variable",
                              name: new Token("Identifier", 1, "i")
                            },
                            right: {
                              kind: "Literal",
                              value: 1
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]);
        });
        it("full form with variable initializer", () => {
          const statements = parse("for (var i = 1; i < 2; i = i + 1) print i;")

          expect(statements).toEqual([
            {
              kind: "Block",
              statements: [
                {
                  kind: "Var",
                  name: new Token("Identifier", 1, "i"),
                  initializer: {
                    kind: "Literal",
                    value: 1
                  }
                },
                {
                  kind: "While",
                  condition: {
                    kind: "Binary",
                    operator: new Token("Less", 1, "<"),
                    left: {
                      kind: "Variable",
                      name: new Token("Identifier", 1, "i")
                    },
                    right: {
                      kind: "Literal",
                      value: 2
                    }
                  },
                  body: {
                    kind: "Block",
                    statements: [
                      {
                        kind: "Print",
                        expression: {
                          kind: "Variable",
                          name: new Token("Identifier", 1, "i")
                        }
                      },
                      {
                        kind: "ExpressionStmt",
                        expression: {
                          kind: "Assign",
                          name: new Token("Identifier", 1, "i"),
                          right: {
                            kind: "Binary",
                            operator: new Token("Plus", 1, "+"),
                            left: {
                              kind: "Variable",
                              name: new Token("Identifier", 1, "i")
                            },
                            right: {
                              kind: "Literal",
                              value: 1
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]);
        });
        it("infinite loop", () => {
          const statements = parse("for (;;) print 1;")

          expect(statements).toEqual([
            {
              kind: "While",
              condition: {
                kind: "Literal",
                value: true
              },
              body: {
                kind: "Print",
                expression: {
                  kind: "Literal",
                  value: 1
                }
              }
            }
          ]);
        });
        it("without initializer", () => {
          const statements = parse("for (; i < 2; i = i + 1) print i;")

          expect(statements).toEqual([
            {
              kind: "While",
              condition: {
                kind: "Binary",
                operator: new Token("Less", 1, "<"),
                left: {
                  kind: "Variable",
                  name: new Token("Identifier", 1, "i")
                },
                right: {
                  kind: "Literal",
                  value: 2
                }
              },
              body: {
                kind: "Block",
                statements: [
                  {
                    kind: "Print",
                    expression: {
                      kind: "Variable",
                      name: new Token("Identifier", 1, "i")
                    }
                  },
                  {
                    kind: "ExpressionStmt",
                    expression: {
                      kind: "Assign",
                      name: new Token("Identifier", 1, "i"),
                      right: {
                        kind: "Binary",
                        operator: new Token("Plus", 1, "+"),
                        left: {
                          kind: "Variable",
                          name: new Token("Identifier", 1, "i")
                        },
                        right: {
                          kind: "Literal",
                          value: 1
                        }
                      }
                    }
                  }
                ]
              }
            }
          ]);
        });
        it("without increment", () => {
          const statements = parse("for (var i = 1; i < 2;) print i;")

          expect(statements).toEqual([
            {
              kind: "Block",
              statements: [
                {
                  kind: "Var",
                  name: new Token("Identifier", 1, "i"),
                  initializer: {
                    kind: "Literal",
                    value: 1
                  }
                },
                {
                  kind: "While",
                  condition: {
                    kind: "Binary",
                    operator: new Token("Less", 1, "<"),
                    left: {
                      kind: "Variable",
                      name: new Token("Identifier", 1, "i")
                    },
                    right: {
                      kind: "Literal",
                      value: 2
                    }
                  },
                  body: {
                    kind: "Print",
                    expression: {
                      kind: "Variable",
                      name: new Token("Identifier", 1, "i")
                    }
                  }
                }
              ]
            }
          ]);
        });
        it("with empty body", () => {
          const statements = parse("for (i = 1; i < 2; i = i + 1) {}")

          expect(statements).toEqual([
            {
              kind: "Block",
              statements: [
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Assign",
                    name: new Token("Identifier", 1, "i"),
                    right: {
                      kind: "Literal",
                      value: 1
                    }
                  }
                },
                {
                  kind: "While",
                  condition: {
                    kind: "Binary",
                    operator: new Token("Less", 1, "<"),
                    left: {
                      kind: "Variable",
                      name: new Token("Identifier", 1, "i")
                    },
                    right: {
                      kind: "Literal",
                      value: 2
                    }
                  },
                  body: {
                    kind: "Block",
                    statements: [
                      {
                        kind: "Block",
                        statements: []
                      },
                      {
                        kind: "ExpressionStmt",
                        expression: {
                          kind: "Assign",
                          name: new Token("Identifier", 1, "i"),
                          right: {
                            kind: "Binary",
                            operator: new Token("Plus", 1, "+"),
                            left: {
                              kind: "Variable",
                              name: new Token("Identifier", 1, "i")
                            },
                            right: {
                              kind: "Literal",
                              value: 1
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]);
        });
        describe("report error", () => {
          it("on missing left paren", () => {
            const errorSpy = jest.spyOn(console, "error");

            parse(`for var i = 0; i < 2; i = i + 1) print i;`);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'var': Expect '(' after 'for'.`);
            expect(hadError()).toBe(true);
          });
          it("on missing right paren", () => {
            const errorSpy = jest.spyOn(console, "error");

            parse(`for (var i = 0; i < 2; i = i + 1 print i;`);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'print': Expect ')' after 'for' clauses.`);
            expect(hadError()).toBe(true);
          });
          it("on missing semicolon", () => {
            const errorSpy = jest.spyOn(console, "error");

            parse(`for (;i < 2) print i;`);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at ')': Expect ';' after 'for' loop condition.`);
            expect(hadError()).toBe(true);
          });
        });
      });
      describe("if", () => {
        it("simple", () => {
          const statements = parse("if (true) print 1;")

          expect(statements).toEqual([
            {
              kind: "If",
              condition: {
                kind: "Literal",
                value: true
              },
              thenBranch: {
                kind: "Print",
                expression: {
                  kind: "Literal",
                  value: 1
                }
              },
              elseBranch: null
            },
          ]);
        });
        it("with else branch", () => {
          const statements = parse("if (true) print 1; else print 2;");

          expect(statements).toEqual([
            {
              kind: "If",
              condition: {
                kind: "Literal",
                value: true
              },
              thenBranch: {
                kind: "Print",
                expression: {
                  kind: "Literal",
                  value: 1
                }
              },
              elseBranch: {
                kind: "Print",
                expression: {
                  kind: "Literal",
                  value: 2
                }
              }
            },
          ]);
        });
        it("with complex expression", () => {
          const statements = parse("if (true or false) print 1;")

          expect(statements).toEqual([
            {
              kind: "If",
              condition: {
                kind: "Logical",
                operator: new Token("Or", 1, "or"),
                left: {
                  kind: "Literal",
                  value: true
                },
                right: {
                  kind: "Literal",
                  value: false
                }
              },
              thenBranch: {
                kind: "Print",
                expression: {
                  kind: "Literal",
                  value: 1
                }
              },
              elseBranch: null
            },
          ]);
        });
        describe("report error", () => {
          it("on missing left paren", () => {
            const errorSpy = jest.spyOn(console, "error");

            parse(`if true or false) print 1;`);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'true': Expect '(' after if.`);
            expect(hadError()).toBe(true);
          });
          it("on missing right  paren", () => {
            const errorSpy = jest.spyOn(console, "error");

            parse(`if (true or false print 1;`);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'print': Expect ')' after if.`);
            expect(hadError()).toBe(true);
          });
        });
      });
      describe("print", () => {
        it("print statement", () => {
          const statements = parse("print 1;")

          expect(statements).toEqual([
            {
              kind: "Print",
              expression: {
                kind: "Literal",
                value: 1
              }
            },
          ]);
        });
        it("report error on missing semicolon", () => {
          const errorSpy = jest.spyOn(console, "error");

          parse(`print 1`);

          expect(errorSpy).toHaveBeenCalledWith(`[1] Error at end: Expect ';' after value.`);
          expect(hadError()).toBe(true);
        });
      });
      describe("return", () => {
        it("no return value", () => {
          const statements = parse("return;")

          expect(statements).toEqual([
            {
              kind: "Return",
              keyword: new Token("Return", 1, "return"),
              value: null
            },
          ]);
        });
        it("return value expression", () => {
          const statements = parse("return 1;")

          expect(statements).toEqual([
            {
              kind: "Return",
              keyword: new Token("Return", 1, "return"),
              value: {
                kind: "Literal",
                value: 1
              }
            },
          ]);
        });
        describe("report error", () => {
          it("on missing semicolon after return value", () => {
            const errorSpy = jest.spyOn(console, "error");

            parse(`return 1`);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at end: Expect ';' after return value.`);
            expect(hadError()).toBe(true);
          });
        });
      });
      describe("while", () => {
        it("simple", () => {
          const statements = parse("while (true) print 1;")

          expect(statements).toEqual([
            {
              kind: "While",
              condition: {
                kind: "Literal",
                value: true
              },
              body: {
                kind: "Print",
                expression: {
                  kind: "Literal",
                  value: 1
                }
              }
            },
          ]);
        });
        describe("report error", () => {
          it("on missing left paren", () => {
            const errorSpy = jest.spyOn(console, "error");

            parse(`while true) print 1;`);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'true': Expect '(' after while.`);
            expect(hadError()).toBe(true);
          });
          it("on missing right paren", () => {
            const errorSpy = jest.spyOn(console, "error");

            parse(`while (true print 1;`);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'print': Expect ')' after while.`);
            expect(hadError()).toBe(true);
          });
        });
      });
      describe("block", () => {
        it("empty", () => {
          const statements = parse(`{}`);

          expect(statements).toEqual([
            {
              kind: "Block",
              statements: []
            },
          ]);
        });
        it("one statement", () => {
          const statements = parse(`{print 1;}`);

          expect(statements).toEqual([
            {
              kind: "Block",
              statements: [
                {
                  kind: "Print",
                  expression: {
                    kind: "Literal",
                    value: 1
                  }
                }
              ]
            },
          ]);
        });
        it("multiple statements", () => {
          const statements = parse(`{print 1;1+1;print true;}`);

          expect(statements).toEqual([
            {
              kind: "Block",
              statements: [
                {
                  kind: "Print",
                  expression: {
                    kind: "Literal",
                    value: 1
                  }
                },
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Binary",
                    operator: new Token("Plus", 1, "+"),
                    left: {
                      kind: "Literal",
                      value: 1
                    },
                    right: {
                      kind: "Literal",
                      value: 1
                    }
                  }
                },
                {
                  kind: "Print",
                  expression: {
                    kind: "Literal",
                    value: true
                  }
                }
              ]
            },
          ]);
        });
        it("sequence of blocks", () => {
          const statements = parse(`{print 1;}{print 2;}`);

          expect(statements).toEqual([
            {
              kind: "Block",
              statements: [
                {
                  kind: "Print",
                  expression: {
                    kind: "Literal",
                    value: 1
                  }
                }
              ]
            },
            {
              kind: "Block",
              statements: [
                {
                  kind: "Print",
                  expression: {
                    kind: "Literal",
                    value: 2
                  }
                }
              ]
            },
          ]);
        });
        describe("report error", () => {
          it("on missing right brace", () => {
            const errorSpy = jest.spyOn(console, "error");

            parse(`{print 1;`);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at end: Expect '}' after block.`);
            expect(hadError()).toBe(true);
          });
        });
      });
      describe("expression statement", () => {
        describe("expressions", () => {
          describe("literals", () => {
            it("boolean literals", () => {
              const statements = parse("true; false;")

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Literal",
                    value: true
                  }
                },
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Literal",
                    value: false
                  }
                }
              ]);
            });
            it("nil literal", () => {
              const statements = parse(`nil;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Literal",
                    value: null
                  }
                }
              ]);
            });
            it("number literal", () => {
              const statements = parse("12;")

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Literal",
                    value: 12
                  }
                }
              ]);
            });
            it("string literal", () => {
              const statements = parse(`"foo";`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Literal",
                    value: "foo"
                  }
                }
              ]);
            });
          });
          describe("grouping", () => {
            it("parses parentheses", () => {
              const statements = parse(`(nil);`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Grouping",
                    expression: {
                      kind: "Literal",
                      value: null
                    }
                  }
                }
              ]);
            });
            it("report error for unmatched parentheses", () => {
              const errorSpy = jest.spyOn(console, "error");

              const statements = parse("(nil;")
              expect(statements).toHaveLength(0);

              expect(errorSpy).toHaveBeenCalledWith(`[1] Error at ';': Expect ')' after expression.`);
              expect(hadError()).toBe(true);
            });
          });
          describe("variable", () => {
            it("variable expression", () => {
              const statements = parse(`variable;`)

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Variable",
                    name: new Token("Identifier", 1, "variable")
                  }
                }
              ]);
            });
          });
          describe("this", () => {
            it("this expression", () => {
              const statements = parse(`this;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "This",
                    keyword: new Token("This", 1, "this")
                  }
                }
              ]);
            });
          });
          describe("super", () => {
            it("super expression", () => {
              const statements = parse(`super.method;`)

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Super",
                    keyword: new Token("Super", 1, "super"),
                    method: new Token("Identifier", 1, "method")
                  }
                }
              ]);
            });
            describe("report error", () => {
              it("on missing dot", () => {
                const errorSpy = jest.spyOn(console, "error");

                const statements = parse(`super method`);
                expect(statements).toHaveLength(0);

                expect(errorSpy).toHaveBeenCalledWith(`[1] Error at 'method': Expect '.' after 'super'.`);
                expect(hadError()).toBe(true);
              });
              it("on missing method", () => {
                const errorSpy = jest.spyOn(console, "error");

                const statements = parse(`super.;`)
                expect(statements).toHaveLength(0);

                expect(errorSpy).toHaveBeenCalledWith(`[1] Error at ';': Expect superclass method name.`);
                expect(hadError()).toBe(true);
              });
            });
          });
          it("report error on malformed primary expression", () => {
            const errorSpy = jest.spyOn(console, "error");

            const statements = parse(`+;`);
            expect(statements).toHaveLength(0);

            expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '+': Expect expression.`);
            expect(hadError()).toBe(true);
          });
          describe("call", () => {
            describe("function call", () => {
              it("call without arguments", () => {
                const statements = parse(`function();`);

                expect(statements).toEqual([
                  {
                    kind: "ExpressionStmt",
                    expression: {
                      kind: "Call",
                      callee: {
                        kind: "Variable",
                        name: new Token("Identifier", 1, "function")
                      },
                      paren: new Token("RightParen", 1, ")"),
                      arguments: []
                    }
                  }
                ]);
              });
              it("call with one argument", () => {
                const statements = parse(`function(1);`);

                expect(statements).toEqual([
                  {
                    kind: "ExpressionStmt",
                    expression: {
                      kind: "Call",
                      callee: {
                        kind: "Variable",
                        name: new Token("Identifier", 1, "function")
                      },
                      paren: new Token("RightParen", 1, ")"),
                      arguments: [
                        {
                          kind: "Literal",
                          value: 1
                        }
                      ]
                    }
                  }
                ]);
              });
              it("call with multiple arguments", () => {
                const statements = parse(`function(1, true);`);

                expect(statements).toEqual([
                  {
                    kind: "ExpressionStmt",
                    expression: {
                      kind: "Call",
                      callee: {
                        kind: "Variable",
                        name: new Token("Identifier", 1, "function")
                      },
                      paren: new Token("RightParen", 1, ")"),
                      arguments: [
                        {
                          kind: "Literal",
                          value: 1
                        },
                        {
                          kind: "Literal",
                          value: true
                        }
                      ]
                    }
                  }
                ]);
              });
              describe("report error", () => {
                it("more than 255 arguments", () => {
                  let source = `function(1`;
                  for (let i = 0; i < 255; i++) {
                    source += `, 1`;
                  }
                  source += `);`;

                  const errorSpy = jest.spyOn(console, "error");

                  const statements = parse(source);
                  // The call expression is still parsed correctly.
                  // This test verifies than an error is reported correctly.
                  expect(statements).toHaveLength(1);

                  expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '1': Can't have more than 255 arguments.`);
                  expect(hadError()).toBe(true);
                });
                it("on missing right parenthesis", () => {
                  const errorSpy = jest.spyOn(console, "error");

                  const statements = parse(`function(1;`);
                  expect(statements).toHaveLength(0);

                  expect(errorSpy).toHaveBeenCalledWith(`[1] Error at ';': Expect ')' after arguments.`);
                  expect(hadError()).toBe(true);
                });
              });
            });
            describe("method call", () => {
              it("call with multiple arguments", () => {
                const statements = parse(`receiver.method(1, "arg", true);`);

                expect(statements).toEqual([
                  {
                    kind: "ExpressionStmt",
                    expression: {
                      kind: "Call",
                      callee: {
                        kind: "Get",
                        name: new Token("Identifier", 1, "method"),
                        object: {
                          kind: "Variable",
                          name: new Token("Identifier", 1, "receiver")
                        }
                      },
                      paren: new Token("RightParen", 1, ")"),
                      arguments: [
                        {
                          kind: "Literal",
                          value: 1
                        },
                        {
                          kind: "Literal",
                          value: "arg"
                        },
                        {
                          kind: "Literal",
                          value: true
                        }
                      ]
                    }
                  }
                ]);
              });
              describe("report error", () => {
                it("on missing property after dot", () => {
                  const errorSpy = jest.spyOn(console, "error");

                  const statements = parse(`receiver.();`);
                  expect(statements).toHaveLength(0);

                  expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '(': Expect property name after '.'.`);
                  expect(hadError()).toBe(true);
                });
              });
            });
          });
          describe("unary", () => {
            it("unary expression", () => {
              const statements = parse(`!true;-1;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Unary",
                    operator: new Token("Bang", 1, "!"),
                    right: {
                      kind: "Literal",
                      value: true
                    }
                  }
                },
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Unary",
                    operator: new Token("Minus", 1, "-"),
                    right: {
                      kind: "Literal",
                      value: 1
                    }
                  }
                }
              ]);
            });
          });
          describe("factor", () => {
            it("simple factor", () => {
              const statements = parse(`1/2;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Binary",
                    operator: new Token("Slash", 1, "/"),
                    left: {
                      kind: "Literal",
                      value: 1
                    },
                    right: {
                      kind: "Literal",
                      value: 2
                    }
                  }
                }
              ]);
            });
            it("chained factor", () => {
              const statements = parse(`1*2/3;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Binary",
                    operator: new Token("Slash", 1, "/"),
                    left: {
                      kind: "Binary",
                      operator: new Token("Star", 1, "*"),
                      left: {
                        kind: "Literal",
                        value: 1
                      },
                      right: {
                        kind: "Literal",
                        value: 2
                      }
                    },
                    right: {
                      kind: "Literal",
                      value: 3
                    }
                  }
                }
              ]);
            });
          });
          describe("term", () => {
            it("simple term", () => {
              const statements = parse(`1-2;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Binary",
                    operator: new Token("Minus", 1, "-"),
                    left: {
                      kind: "Literal",
                      value: 1
                    },
                    right: {
                      kind: "Literal",
                      value: 2
                    }
                  }
                }
              ]);
            });
            it("chained term", () => {
              const statements = parse(`1+2-3;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Binary",
                    operator: new Token("Minus", 1, "-"),
                    left: {
                      kind: "Binary",
                      operator: new Token("Plus", 1, "+"),
                      left: {
                        kind: "Literal",
                        value: 1
                      },
                      right: {
                        kind: "Literal",
                        value: 2
                      }
                    },
                    right: {
                      kind: "Literal",
                      value: 3
                    }
                  }
                }
              ]);
            });
          });
          it("combine terms and factors according to operator priorities", () => {
            const statements = parse(`1+2*3;`);

            expect(statements).toEqual([
              {
                kind: "ExpressionStmt",
                expression: {
                  kind: "Binary",
                  operator: new Token("Plus", 1, "+"),
                  left: {
                    kind: "Literal",
                    value: 1
                  },
                  right: {
                    kind: "Binary",
                    operator: new Token("Star", 1, "*"),
                    left: {
                      kind: "Literal",
                      value: 2
                    },
                    right: {
                      kind: "Literal",
                      value: 3
                    }
                  }
                }
              }
            ]);
          });
          describe("comparison", () => {
            it("simple comparison", () => {
              const statements = parse(`1 > 2;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Binary",
                    operator: new Token("Greater", 1, ">"),
                    left: {
                      kind: "Literal",
                      value: 1
                    },
                    right: {
                      kind: "Literal",
                      value: 2
                    }
                  }
                }
              ]);
            });
            it("chained comparison", () => {
              const statements = parse(`1 < 2 <= 3;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Binary",
                    operator: new Token("LessEqual", 1, "<="),
                    left: {
                      kind: "Binary",
                      operator: new Token("Less", 1, "<"),
                      left: {
                        kind: "Literal",
                        value: 1
                      },
                      right: {
                        kind: "Literal",
                        value: 2
                      }
                    },
                    right: {
                      kind: "Literal",
                      value: 3
                    }
                  }
                }
              ]);
            });
          });
          describe("equality", () => {
            it("simple equality", () => {
              const statements = parse(`1 == 2;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Binary",
                    operator: new Token("EqualEqual", 1, "=="),
                    left: {
                      kind: "Literal",
                      value: 1
                    },
                    right: {
                      kind: "Literal",
                      value: 2
                    }
                  }
                }
              ]);
            });
            it("chained equality", () => {
              const statements = parse(`1 == 2 != 3;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Binary",
                    operator: new Token("BangEqual", 1, "!="),
                    left: {
                      kind: "Binary",
                      operator: new Token("EqualEqual", 1, "=="),
                      left: {
                        kind: "Literal",
                        value: 1
                      },
                      right: {
                        kind: "Literal",
                        value: 2
                      }
                    },
                    right: {
                      kind: "Literal",
                      value: 3
                    }
                  }
                }
              ]);
            });
          });
          describe("and", () => {
            it("simple and", () => {
              const statements = parse(`true and false;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Logical",
                    operator: new Token("And", 1, "and"),
                    left: {
                      kind: "Literal",
                      value: true
                    },
                    right: {
                      kind: "Literal",
                      value: false
                    }
                  }
                }
              ]);
            });
            it("chained and", () => {
              const statements = parse(`true and false and true;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Logical",
                    operator: new Token("And", 1, "and"),
                    left: {
                      kind: "Logical",
                      operator: new Token("And", 1, "and"),
                      left: {
                        kind: "Literal",
                        value: true
                      },
                      right: {
                        kind: "Literal",
                        value: false
                      }
                    },
                    right: {
                      kind: "Literal",
                      value: true
                    }
                  }
                }
              ]);
            });
          });
          describe("or", () => {
            it("simple or", () => {
              const statements = parse(`true or false;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Logical",
                    operator: new Token("Or", 1, "or"),
                    left: {
                      kind: "Literal",
                      value: true
                    },
                    right: {
                      kind: "Literal",
                      value: false
                    }
                  }
                }
              ]);
            });
            it("chained or", () => {
              const statements = parse(`true or false or true;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Logical",
                    operator: new Token("Or", 1, "or"),
                    left: {
                      kind: "Logical",
                      operator: new Token("Or", 1, "or"),
                      left: {
                        kind: "Literal",
                        value: true
                      },
                      right: {
                        kind: "Literal",
                        value: false
                      }
                    },
                    right: {
                      kind: "Literal",
                      value: true
                    }
                  }
                }
              ]);
            });
          });
          describe("assignment", () => {
            it("to variable", () => {
              const statements = parse(`variable = true;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Assign",
                    name: new Token("Identifier", 1, "variable"),
                    right: {
                      kind: "Literal",
                      value: true
                    }
                  }
                }
              ]);
            });
            it("to property", () => {
              const statements = parse(`receiver.method = true;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Set",
                    object: {
                      kind: "Variable",
                      name: new Token("Identifier", 1, "receiver")
                    },
                    name: new Token("Identifier", 1, "method"),
                    value: {
                      kind: "Literal",
                      value: true
                    }
                  }
                }
              ]);
            });
            it("nested", () => {
              const statements = parse(`variable = anotherVariable = true;`);

              expect(statements).toEqual([
                {
                  kind: "ExpressionStmt",
                  expression: {
                    kind: "Assign",
                    name: new Token("Identifier", 1, "variable"),
                    right: {
                      kind: "Assign",
                      name: new Token("Identifier", 1, "anotherVariable"),
                      right: {
                        kind: "Literal",
                        value: true
                      }
                    }
                  }
                }
              ]);
            });
            describe("report error", () => {
              it("on invalid assignment target", () => {
                const errorSpy = jest.spyOn(console, "error");

                parse(`true = 1;`);

                expect(errorSpy).toHaveBeenCalledWith(`[1] Error at '=': Invalid assignment target.`);
                expect(hadError()).toBe(true);
              });
            });
          });
        });
      });
    });
  });
});
