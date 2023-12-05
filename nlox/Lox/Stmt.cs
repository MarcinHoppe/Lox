abstract record Stmt();

record ExpressionStmt(Expr Expression) : Stmt;
record Print(Expr Expression) : Stmt;
record Var(Token Name, Expr? Initializer) : Stmt;
record Block(List<Stmt> Statements) : Stmt;
record If(Expr Condition, Stmt ThenBranch, Stmt? ElseBranch) : Stmt;
record While(Expr Condition, Stmt Body) : Stmt;
record Function(Token Name, List<Token> Params, List<Stmt> Body) : Stmt;
record Return(Token Keyword, Expr? Value) : Stmt;
record ClassDecl(Token Name, Variable? Superclass, List<Function> Methods): Stmt;
