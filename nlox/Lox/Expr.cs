abstract record Expr();

record Binary(Expr Left, Token Operator, Expr Right) : Expr;
record Grouping(Expr Expression) : Expr;
record Literal(Object? Value) : Expr;
record Unary(Token Operator, Expr Right) : Expr;
record Variable(Token Name) : Expr;
record Assign(Token Name, Expr Value): Expr;
record Logical(Expr Left, Token Operator, Expr Right) : Expr;
record Call(Expr Callee, Token Paren, List<Expr> Arguments) : Expr;
record Get(Expr Object, Token Name) : Expr;
record Set(Expr Object, Token Name, Expr Value) : Expr;
record This(Token Keyword) : Expr;
record Super(Token Keyword, Token Method) : Expr;
