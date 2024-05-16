import { error } from "./error";
import { Expr, Variable } from "./expr";
import { Stmt, Function } from "./stmt";
import { Token, TokenType } from "./token";

export class ParseError extends Error { }

export class Parser {
  private current = 0;

  constructor(private readonly tokens: Token[]) { }

  parse() {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt != null) {
        statements.push(stmt);
      }
    }
    return statements;
  }

  private declaration() {
    try {
      if (this.match("Class")) {
        return this.classDeclaration();
      }
      if (this.match("Fun")) {
        return this.function("function");
      }
      if (this.match("Var")) {
        return this.varDeclaration();
      }
      
      return this.statement();
    } catch (e) {
      if (e instanceof ParseError) {
        this.synchronize();
        return null;
      }
      throw e;
    }
  }

  private statement(): Stmt {
    if (this.match("For")) {
      return this.forStatement();
    }
    if (this.match("If")) {
      return this.ifStatement();
    }
    if (this.match("Print")) {
      return this.printStatement();
    }
    if (this.match("Return")) {
      return this.returnStatement();
    }
    if (this.match("While")) {
      return this.whileStatement();
    }
    if (this.match("LeftBrace")) {
      return { kind: "Block", statements: this.block() };
    }
    return this.expressionStatement();
  }

  private forStatement(): Stmt {
    this.consume("LeftParen", "Expect '(' after 'for'.");

    let initializer;
    if (this.match("Semicolon")) {
      initializer = null;
    } else if (this.match("Var")) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }
    
    let condition: Expr | null = null;
    if (!this.check("Semicolon")) {
      condition = this.expression();
    }
    this.consume("Semicolon", "Expect ';' after 'for' loop condition.");

    let increment = null;
    if (!this.check("RightParen")) {
      increment = this.expression();
    }
    this.consume("RightParen", "Expect ')' after 'for' clauses.");

    let body = this.statement();

    if (increment) {
      const incrementStmt: Stmt = { kind: "ExpressionStmt", expression: increment };
      body = { kind: "Block", statements: [body, incrementStmt] };
    }

    if (!condition) {
      condition = { kind: "Literal", value: true };
    }

    body = { kind: "While", condition, body };

    if (initializer) {
      body = { kind: "Block", statements: [initializer, body] };
    }

    return body;
  }

  private ifStatement(): Stmt {
    this.consume("LeftParen", "Expect '(' after if.");
    const condition = this.expression();
    this.consume("RightParen", "Expect ')' after if.");

    const thenBranch = this.statement();
    let elseBranch = null;

    if (this.match("Else")) {
      elseBranch = this.statement();
    }
    
    return { kind: "If", condition, thenBranch, elseBranch };
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume("Semicolon", "Expect ';' after value.");
    return { kind: "Print", expression: value };
  }

  private returnStatement(): Stmt {
    const keyword = this.previous();
    let value: Expr | null = null;

    if (!this.check("Semicolon")) {
      value = this.expression();
    }

    this.consume("Semicolon", "Expect ';' after return value.");
    return { kind: "Return", keyword, value };
  }

  private whileStatement(): Stmt {
    this.consume("LeftParen", "Expect '(' after while.");
    const condition = this.expression();
    this.consume("RightParen", "Expect ')' after while.");

    const body = this.statement();

    return { kind: "While", condition, body };
  }

  private classDeclaration(): Stmt {
    const name = this.consume("Identifier", "Expect class name.");

    let superclass: Variable | null = null;
    if (this.match("Less")) {
      this.consume("Identifier", "Expect superclass name.");
      superclass = { kind: "Variable", name: this.previous() };
    }

    this.consume("LeftBrace", "Expect '{' before class body.");
    
    const methods: Function[] = [];
    while (!this.check("RightBrace") && !this.isAtEnd()) {
      const method = this.function("method");
      methods.push(method);
    }
 
    this.consume("RightBrace", "Expect '}' after class body.");

    return { kind: "ClassDecl", name, superclass, methods };
  }

  private function(kind: string): Function {
    const name = this.consume("Identifier", `Expect ${kind} name.`);
    this.consume("LeftParen", `Expect '(' after ${kind} name.`);

    const params: Token[] = [];
    if (!this.check("RightParen")) {
      do {
        if (params.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.");
        }
        const param = this.consume("Identifier", "Expect parameter name.");
        params.push(param);
      } while (this.match("Comma"));
    }

    this.consume("RightParen", `Expect ')' after ${kind} parameters.`);
    this.consume("LeftBrace", `Expect '{' before ${kind} body.`);

    const body = this.block();

    return { kind: "Function", name, params, body };
  }

  private block(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.check("RightBrace") && !this.isAtEnd()) {
      const decl = this.declaration();
      if (decl) {
        statements.push(decl);
      }
    }

    this.consume("RightBrace", "Expect '}' after block.");
    return statements;
  }

  private varDeclaration(): Stmt {
    const name = this.consume("Identifier", "Expect variable name.")
    let initializer = null;

    if (this.match("Equal")) {
      initializer = this.expression();
    }

    this.consume("Semicolon", "Expect ';' after variable declaration.");
    return { kind: "Var", name, initializer };
  }

  private expressionStatement(): Stmt {
    const expr = this.expression();
    this.consume("Semicolon", "Expect ';' after expression.");
    return { kind: "ExpressionStmt", expression: expr };
  }

  private expression() {
    return this.assignment();
  }

  private assignment(): Expr {
    let expr = this.or();

    if (this.match("Equal")) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr.kind === "Variable") {
        const name = expr.name;
        return { kind: "Assign", name, right: value };
      } else if (expr.kind === "Get") {
        return { kind: "Set", object: expr.object, name: expr.name, value };
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private or() {
    let expr = this.and();

    while (this.match("Or")) {
      const operator = this.previous();
      const right = this.and();
      expr = { kind: "Logical", left: expr, operator, right };
    }

    return expr;
  }

  private and() {
    let expr = this.equality();

    while (this.match("And")) {
      const operator = this.previous();
      const right = this.equality();
      expr = { kind: "Logical", left: expr, operator, right };
    }

    return expr;
  }

  private equality() {
    let expr = this.comparison();

    while (this.match("EqualEqual", "BangEqual")) {
      const operator = this.previous();
      const right = this.comparison();
      expr = { kind: "Binary", left: expr, operator, right };
    }

    return expr;
  }

  private comparison() {
    let expr = this.term();

    while (this.match("Greater", "GreaterEqual", "Less", "LessEqual")) {
      const operator = this.previous();
      const right = this.term();
      expr = { kind: "Binary", left: expr, operator, right };
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match("Plus", "Minus")) {
      const operator = this.previous();
      const right = this.factor();
      expr = { kind: "Binary", left: expr, operator, right };
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match("Slash", "Star")) {
      const operator = this.previous();
      const right = this.unary();
      expr = { kind: "Binary", left: expr, operator, right };
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match("Bang", "Minus")) {
      const operator = this.previous();
      const right = this.unary();
      return { kind: "Unary", operator, right };
    }

    return this.call();
  }

  private call() {
    let expr = this.primary();

    while (true) {
      if (this.match("LeftParen")) {
        expr = this.finishCall(expr);
      } else if (this.match("Dot")) {
        const name = this.consume("Identifier", "Expect property name after '.'.");
        expr = { kind: "Get", object: expr, name };
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args: Expr[] = [];
    if (!this.check("RightParen")) {
      do {
        if (args.length >= 255) {
          error(this.peek(), "Can't have more than 255 arguments.");
        }
        const argExpr = this.expression();
        args.push(argExpr);
      } while (this.match("Comma"));
    }
    const paren = this.consume("RightParen", "Expect ')' after arguments.");
    return { kind: "Call", callee, paren, arguments: args };
  }

  private primary(): Expr {
    if (this.match("True")) {
      return { kind: "Literal", value: true };
    }
    if (this.match("False")) {
      return { kind: "Literal", value: false };
    }
    if (this.match("Nil")) {
      return { kind: "Literal", value: null };
    }

    if (this.match("Super")) {
      const keyword = this.previous();
      this.consume("Dot", "Expect '.' after 'super'.");
      const method = this.consume("Identifier", "Expect superclass method name.");
      return { kind: "Super", keyword, method };
    }

    if (this.match("Number", "String")) {
      return { kind: "Literal", value: this.previous().literal };
    }

    if (this.match("This")) {
      return { kind: "This", keyword: this.previous() };
    }

    if (this.match("Identifier")) {
      return { kind: "Variable", name: this.previous() };
    }

    if (this.match("LeftParen")) {
      const expr = this.expression();
      this.consume("RightParen", "Expect ')' after expression.");
      return { kind: "Grouping", expression: expr };
    }

    const exception = this.error(this.peek(), "Expect expression.");
    throw exception;
  }

  private peek() {
    return this.tokens[this.current];
  }

  private isAtEnd() {
    return this.peek().type === "Eof";
  }

  private match(...types: TokenType[]) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType) {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }

  private advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private previous() {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) {
      return this.advance();
    }

    const exception = this.error(this.peek(), message);
    throw exception;
  }

  private error(token: Token, message: string) {
    error(token, message);
    return new ParseError();
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === "Semicolon") {
        return;
      }

      switch (this.peek().type) {
        case "Class":
        case "For":
        case "Fun":
        case "If":
        case "Print":
        case "Return":
        case "Var":
        case "While":
          return;
      }

      this.advance();
    }
  }
}
