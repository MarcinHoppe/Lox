import { Token } from "./token"

export type Literal = {
  kind: "Literal",
  value: unknown | null
}

export type Grouping = {
  kind: "Grouping",
  expression: Expr
}

export type Variable = {
  kind: "Variable",
  name: Token
}

export type This = {
  kind: "This",
  keyword: Token
}

export type Super = {
  kind: "Super",
  keyword: Token,
  method: Token
}

export type Call = {
  kind: "Call",
  callee: Expr,
  paren: Token,
  arguments: Expr[]
}

export type Get = {
  kind: "Get",
  object: Expr,
  name: Token
}

export type Set = {
  kind: "Set",
  object: Expr,
  name: Token,
  value: Expr
}

export type Unary = {
  kind: "Unary",
  operator: Token,
  right: Expr,
}

export type Binary = {
  kind: "Binary",
  left: Expr,
  operator: Token,
  right: Expr
}

export type Logical = {
  kind: "Logical",
  left: Expr,
  operator: Token,
  right: Expr
}

export type Assign = {
  kind: "Assign",
  name: Token,
  right: Expr
}

export type Expr =
    Literal
  | Grouping
  | Variable
  | This
  | Super
  | Call
  | Get
  | Set
  | Unary
  | Binary
  | Logical
  | Assign;
