import Environment from "./environment";
import type { Assign, Binary, Call, Expr, Get, Logical, Set, Super, This, Unary } from "./expr";
import { ClockFunction } from "./nativefunctions";
import RuntimeError from "./runtimeerror";
import type { ClassDecl, ExpressionStmt, Function, If, Print, Return, Stmt, Var, While } from "./stmt";
import { runtimeError } from "./error";
import { assertNever } from "./typeutils";
import type { Token } from "./token";
import LoxFunction from "./loxfunction";
import { isLoxCallable } from "./loxcallable";
import ReturnException from "./return";
import { LoxClass, isLoxClass } from "./loxclass";
import { LoxInstance, isLoxInstance } from "./loxinstance";

function toString(obj: unknown) {
  if (obj === null || obj === undefined) {
    return "nil";
  }
  // TODO: implement rest of the logic.
  return obj.toString();
}

function isEqual(left: unknown, right: unknown) {
  if (left === null && right === null) {
    return true;
  }
  if (left === null) {
    return false;
  }
  return left === right;
}

function isTruthy(right: unknown) {
  if (right === null) {
    return false;
  }
  if (typeof right === "boolean") {
    return right;
  }
  return true;
}

export default class Interpreter {
  private readonly globals = new Environment();
  private environment: Environment;
  private locals = new Map<Expr, number>();

  constructor() {
    this.environment = this.globals;
    this.globals.define("clock", new ClockFunction());
  }

  interpret(statements: Stmt[]) {
    try {
      for (const stmt of statements) {
        this.execute(stmt);
      }
    } catch (e) {
      if (e instanceof RuntimeError) {
        runtimeError(e);
        return;
      }
      throw e;
    }
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
  }

  private execute(stmt: Stmt) {
    switch (stmt.kind) {
      case "If":
        this.executeIf(stmt);
        break;
      case "Print":
        this.executePrint(stmt);
        break;
      case "Return":
        this.executeReturn(stmt);
        break;
      case "While":
        this.executeWhile(stmt);
        break;
      case "Block":
        this.executeBlock(stmt.statements, new Environment(this.environment));
        break;
      case "ClassDecl":
        this.executeClassDecl(stmt);
        break;
      case "Function":
        this.executeFunction(stmt);
        break;
      case "Var":
        this.executeVar(stmt);
        break;
      case "ExpressionStmt":
        this.executeExpressionStmt(stmt);
        break;
      default:
        assertNever(stmt);
    }
  }

  private evaluate(expr: Expr): unknown {
    switch (expr.kind) {
      case "Literal": return expr.value;
      case "Grouping": return this.evaluate(expr.expression);
      case "Variable": return this.lookupVariable(expr.name, expr);
      case "This": return this.evaluateThis(expr);
      case "Super": return this.evaluateSuper(expr);
      case "Call": return this.evaluateCall(expr);
      case "Get": return this.evaluateGet(expr);
      case "Set": return this.evaluateSet(expr);
      case "Unary": return this.evaluateUnary(expr);
      case "Binary": return this.evaluateBinary(expr);
      case "Logical": return this.evaluateLogical(expr);
      case "Assign": return this.evaluateAssign(expr);
      default:
        assertNever(expr);
    }
  }

  private executeIf(stmt: If) {
    if (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.execute(stmt.elseBranch);
    }
  }

  private executePrint(stmt: Print) {
    const value = this.evaluate(stmt.expression);
    console.log(toString(value));
  }

  private executeReturn(stmt: Return) {
    let value = null;
    if (stmt.value) {
      value = this.evaluate(stmt.value);
    }
    throw new ReturnException(value);
  }

  private executeWhile(stmt: While) {
    while (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  executeBlock(statements: Stmt[], env: Environment) {
    const previous = this.environment;

    try {
      this.environment = env;

      for (const stmt of statements) {
        this.execute(stmt);
      }
    } finally {
      this.environment = previous;
    }
  }

  private executeClassDecl(stmt: ClassDecl) {
    let superclass: unknown = undefined;
    if (stmt.superclass) {
      superclass = this.evaluate(stmt.superclass);
      if (!isLoxClass(superclass)) {
        throw new RuntimeError(stmt.superclass.name, "Superclass must be a class.");
      }
    }

    this.environment.define(stmt.name.lexeme, null);

    if (stmt.superclass) {
      this.environment = new Environment(this.environment);
      this.environment.define("super", superclass);
    }

    const methods = new Map<string, LoxFunction>();
    for (const method of stmt.methods) {
      const isInitializer = method.name.lexeme === "init";
      const fn = new LoxFunction(method, this.environment, isInitializer);
      methods.set(method.name.lexeme, fn);
    }

    const klass = new LoxClass(stmt.name.lexeme, methods, superclass as LoxClass | undefined);

    if (superclass) {
      this.environment = this.environment.enclosing!;
    }

    this.environment.assign(stmt.name, klass);
  }

  private executeFunction(stmt: Function) {
    const fun = new LoxFunction(stmt, this.environment, false);
    this.environment.define(stmt.name.lexeme, fun);
  }

  private executeVar(stmt: Var) {
    let value = null;
    if (stmt.initializer) {
      value = this.evaluate(stmt.initializer);
    }
    this.environment.define(stmt.name.lexeme, value);
  }

  private executeExpressionStmt(stmt: ExpressionStmt) {
    this.evaluate(stmt.expression);
  }

  private evaluateThis(expr: This) {
    return this.lookupVariable(expr.keyword, expr);
  }

  private evaluateSuper(expr: Super): unknown {
    const distance = this.locals.get(expr)!;
    const superclass = this.environment.getAt(distance, "super") as LoxClass;
    const instance = this.environment.getAt(distance - 1, "this") as LoxInstance;
    const method = superclass.findMethod(expr.method.lexeme);

    if (!method) {
      throw new RuntimeError(expr.method, `Undefined property '${expr.method.lexeme}'.`);
    }

    return method.bind(instance!);
  }

  private evaluateCall(expr: Call): unknown {
    const callee = this.evaluate(expr.callee);

    const args = [];
    for (const argExpr of expr.arguments) {
      args.push(this.evaluate(argExpr));
    }

    if (!isLoxCallable(callee)) {
      throw new RuntimeError(expr.paren, "Can only call functions and classes.");
    }

    if (args.length != callee.arity) {
      throw new RuntimeError(expr.paren, `Expected ${callee.arity} arguments but got ${args.length}.`);
    }

    return callee.call(this, args);
  }

  private evaluateGet(expr: Get): unknown {
    const obj = this.evaluate(expr.object);
    if (isLoxInstance(obj)) {
      return obj.get(expr.name);
    }
    throw new RuntimeError(expr.name, "Only instances have properties.");
  }

  private evaluateSet(expr: Set): unknown {
    const obj = this.evaluate(expr.object);
    if (isLoxInstance(obj)) {
      const value = this.evaluate(expr.value);
      obj.set(expr.name, value);
      return value;
    }
    throw new RuntimeError(expr.name, "Only instances have properties.");
  }

  private evaluateUnary(expr: Unary): unknown {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case "Bang":
        return !isTruthy(right);
      case "Minus":
        this.checkNumberOperand(expr.operator, right);
        return -(right as number);
    }

    return null;
  }

  private evaluateBinary(expr: Binary): unknown {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case "Greater":
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) > (right as number);
      case "GreaterEqual":
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) >= (right as number);
      case "Less":
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) < (right as number);
      case "LessEqual":
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) <= (right as number);
      case "EqualEqual":
        return isEqual(left, right);
      case "BangEqual":
        return !isEqual(left, right);
      case "Minus":
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) - (right as number);
      case "Star":
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) * (right as number);
      case "Slash":
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) / (right as number);
      case "Plus":
        if (typeof left === "string" && typeof right === "string") {
          return (left as string) + (right as string);
        }
        if (typeof left === "number" && typeof right === "number") {
          return (left as number) + (right as number);
        }
        throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
    }

    return null;
  }

  private evaluateLogical(expr: Logical): unknown {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === "Or") {
      if (isTruthy(left)) {
        return left;
      }
    } else {
      if (!isTruthy(left)) {
        return left;
      }
    }

    return this.evaluate(expr.right);
  }

  private evaluateAssign(expr: Assign): unknown {
    const value = this.evaluate(expr.right);

    if (this.locals.has(expr)) {
      const distance = this.locals.get(expr)!;
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }

    return value;
  }

  private lookupVariable(name: Token, expr: Expr) {
    if (this.locals.has(expr)) {
      const distance = this.locals.get(expr)!;
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
  }

  private checkNumberOperand(operator: Token, right: unknown) {
    if (typeof right === "number") {
      return;
    }
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  private checkNumberOperands(operator: Token, left: unknown, right: unknown) {
    if (typeof left === "number" && typeof right === "number") {
      return;
    }
    throw new RuntimeError(operator, "Operands must be numbers.");
  }
}
