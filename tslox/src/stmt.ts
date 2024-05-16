import { Expr, Variable } from "./expr"
import { Token } from "./token"

export type If = {
  kind: "If",
  condition: Expr,
  thenBranch: Stmt,
  elseBranch: Stmt | null
}

export type Print = {
  kind: "Print",
  expression: Expr
}

export type Return = {
  kind: "Return",
  keyword: Token,
  value: Expr | null
}

export type While = {
  kind: "While",
  condition: Expr,
  body: Stmt
}

export type Block = {
  kind: "Block",
  statements: Stmt[]
}

export type ClassDecl = {
  kind: "ClassDecl",
  name: Token,
  superclass: Variable | null,
  methods: Function[]
}

export type Function = {
  kind: "Function",
  name: Token,
  params: Token[],
  body: Stmt[]
}

export type Var = {
  kind: "Var",
  name: Token,
  initializer: Expr | null
}

export type ExpressionStmt = {
  kind: "ExpressionStmt",
  expression: Expr
}

export type Stmt =
    If
  | Print
  | Return
  | While
  | Block
  | ClassDecl
  | Function
  | Var
  | ExpressionStmt;
