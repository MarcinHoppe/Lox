import { ClassType } from "./classtype";
import { error } from "./error";
import { Assign, Binary, Call, Expr, Get, Grouping, Logical, Set, Super, This, Unary, Variable } from "./expr";
import { FunctionType } from "./functiontype";
import { Block, ClassDecl, ExpressionStmt, Function, If, Print, Return, Stmt, Var, While } from "./stmt";
import { Token } from "./token";

export type ResolveLocal = (expr: Expr, depth: number) => void;

type Scope = Map<string, boolean>;

export class Resolver {
  private scopes: Scope[] = [];
  private currentFunction: FunctionType = "None";
  private currentClass: ClassType = "None";

  constructor(private resolveLocalFn: ResolveLocal) { }

  public resolve(statements: Stmt[]) {
    for (const stmt of statements) {
      this.resolveStmt(stmt);
    }
  }

  private resolveStmt(stmt: Stmt) {
    switch (stmt.kind) {
      case "Block":
        this.resolveBlock(stmt);
        break;
      case "ClassDecl":
        this.resolveClass(stmt);
        break;
      case "Var":
        this.resolveVar(stmt);
        break;
      case "If":
        this.resolveIf(stmt);
        break;
      case "Print":
        this.resolvePrint(stmt);
        break;
      case "Return":
        this.resolveReturn(stmt);
        break;
      case "While":
        this.resolveWhile(stmt);
        break;
      case "Function":
        this.resolveFunction(stmt);
        break;
      case "ExpressionStmt":
        this.resolveExpressionStmt(stmt);
        break;
      default:
        throw new Error("Unknow statement");
    }
  }
  
  private resolveBlock(stmt: Block) {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }

  private resolveClass(stmt: ClassDecl) {
    const enclosingClass = this.currentClass;
    this.currentClass = "Class";

    this.declare(stmt.name);
    this.define(stmt.name);

    if (stmt.superclass && stmt.name.lexeme === stmt.superclass.name.lexeme) {
      error(stmt.superclass.name, "A class can't inherit from itself.");
    }

    if (stmt.superclass) {
      this.currentClass = "Subclass";
      this.resolveVariable(stmt.superclass);
    }

    if (stmt.superclass) {
      this.beginScope();
      const scope = this.scopes[this.scopes.length - 1];
      scope.set("super", true);
    }

    this.beginScope();
    const scope = this.scopes[this.scopes.length - 1];
    scope.set("this", true);

    for (const method of stmt.methods) {
      let functionType: FunctionType = "Method";
      if (method.name.lexeme === "init") {
        functionType = "Initializer";
      }

      this.resolveAnyFunction(method, functionType);
    }

    this.endScope();

    if (stmt.superclass) {
      this.endScope();
    }

    this.currentClass = enclosingClass;
  }

  private resolveIf(stmt: If) {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.thenBranch);

    if (stmt.elseBranch) {
      this.resolveStmt(stmt.elseBranch);
    }
  }

  private resolvePrint(stmt: Print) {
    this.resolveExpr(stmt.expression);
  }

  private resolveFunction(stmt: Function) {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveAnyFunction(stmt, "Function");
  }

  private resolveAnyFunction(stmt: Function, functionType: FunctionType) {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = functionType;

    this.beginScope();
    for (const param of stmt.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(stmt.body);
    this.endScope();

    this.currentFunction = enclosingFunction;
  }

  private resolveWhile(stmt: While) {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.body);
  }

  private resolveReturn(stmt: Return) {
    if (this.currentFunction === "None") {
      error(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value) {
      if (this.currentFunction === "Initializer") {
        error(stmt.keyword, "Can't return from an initializer.");
      }

      this.resolveExpr(stmt.value);
    }
  }

  private resolveVar(stmt: Var) {
    this.declare(stmt.name);
    if (stmt.initializer) {
      this.resolveExpr(stmt.initializer);
    }
    this.define(stmt.name);
  }

  private resolveExpressionStmt(stmt: ExpressionStmt) {
    this.resolveExpr(stmt.expression);
  }

  private resolveExpr(expr: Expr) {
    switch (expr.kind) {
      case "Literal":
        break;
      case "Grouping":
        this.resolveGrouping(expr);
        break;
      case "Variable":
        this.resolveVariable(expr);
        break;
      case "This":
        this.resolveThis(expr);
        break;
      case "Super":
        this.resolveSuper(expr);
        break;
      case "Call":
        this.resolveCall(expr);
        break;
      case "Get":
        this.resolveGet(expr);
        break;
      case "Set":
        this.resolveSet(expr);
        break;
      case "Unary":
        this.resolveUnary(expr);
        break;
      case "Binary":
        this.resolveBinary(expr);
        break;
      case "Logical":
        this.resolveLogical(expr);
        break;
      case "Assign":
        this.resolveAssign(expr);
        break;
      default:
        throw new Error("Unknown expression");
    }
  }

  private resolveGrouping(expr: Grouping) {
    this.resolveExpr(expr.expression);
  }

  private resolveVariable(expr: Variable) {
    if (this.scopes.length > 0) {
      const scope = this.scopes[this.scopes.length - 1];
      if (scope.has(expr.name.lexeme)) {
        if (scope.get(expr.name.lexeme) === false) {
          error(expr.name, "Can't read local variable in its own initializer");
        }
      }
    }

    this.resolveLocal(expr, expr.name);
  }

  private resolveThis(expr: This) {
    if (this.currentClass === "None") {
      error(expr.keyword, "Can't use 'this' outside of a class.");
    }

    this.resolveLocal(expr, expr.keyword);
  }

  private resolveSuper(expr: Super) {
    if (this.currentClass === "None") {
      error(expr.keyword, "Can't use 'super' outside of a class.");
    } else if (this.currentClass === "Class") {
      error(expr.keyword, "Can't use 'super' in a class no superclass.");
    }

    this.resolveLocal(expr, expr.keyword);
  }

  private resolveCall(expr: Call) {
    this.resolveExpr(expr.callee);
    for (const arg of expr.arguments) {
      this.resolveExpr(arg);
    }
  }

  private resolveGet(expr: Get) {
    this.resolveExpr(expr.object);
  }

  private resolveSet(expr: Set) {
    this.resolveExpr(expr.value);
    this.resolveExpr(expr.object);
  }

  private resolveUnary(expr: Unary) {
    this.resolveExpr(expr.right);
  }

  private resolveBinary(expr: Binary) {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  private resolveLogical(expr: Logical) {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  private resolveAssign(expr: Assign) {
    this.resolveExpr(expr.right);
    this.resolveLocal(expr, expr.name);
  }
  
  private resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.resolveLocalFn(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  private beginScope() {
    this.scopes.push(new Map<string, boolean>());
  }

  private endScope() {
    this.scopes.pop();
  }

  private declare(name: Token) {
    if (this.scopes.length === 0) {
      return;
    }
    const scope = this.scopes[this.scopes.length - 1];

    if (scope.has(name.lexeme)) {
      error(name, "There already is a variable with this name in this scope.");
    }

    scope.set(name.lexeme, false);
  }

  private define(name: Token) {
    if (this.scopes.length === 0) {
      return;
    }
    const scope = this.scopes[this.scopes.length - 1];
    scope.set(name.lexeme, true);
  }
}
