class ParseError : Exception
{
}

class Parser
{
  private List<Token> tokens;
  private int current = 0;

  public Parser(List<Token> tokens)
  {
    this.tokens = tokens;
  }

  public List<Stmt> Parse()
  {
    var statements = new List<Stmt>();
    while (!IsAtEnd())
    {
      var decl = Declaration();
      if (decl != null)
      {
        statements.Add(decl);
      }
    }
    return statements;
  }

  private Expr Expression() => Assignment();

  private Stmt? Declaration()
  {
    try
    {
      if (Match(TokenType.Class))
      {
        return ClassDeclaration();
      }
      if (Match(TokenType.Fun))
      {
        return Function("function");
      }
      if (Match(TokenType.Var))
      {
        return VarDeclaration();
      }

      return Statement();
    }
    catch (ParseError)
    {
      Synchronize();
      return null;
    }
  }

  private Stmt Statement()
  {
    if (Match(TokenType.For))
    {
      return ForStatement();
    }
    if (Match(TokenType.If))
    {
      return IfStatement();
    }
    if (Match(TokenType.Print))
    {
      return PrintStatement();
    }
    if (Match(TokenType.Return))
    {
      return ReturnStatement();
    }
    if (Match(TokenType.While))
    {
      return WhileStatement();
    }
    if (Match(TokenType.LeftBrace))
    {
      return new Block(Block());
    }
    return ExpressionStatement();
  }

  private Stmt ForStatement()
  {
    Consume(TokenType.LeftParen, "Expect '(' after 'for'.");

    Stmt? initializer;
    if (Match(TokenType.Semicolon))
    {
      initializer = null;
    }
    else if (Match(TokenType.Var))
    {
      initializer = VarDeclaration();
    }
    else
    {
      initializer = ExpressionStatement();
    }

    Expr? condition = null;
    if (!Check(TokenType.Semicolon))
    {
      condition = Expression();
    }
    Consume(TokenType.Semicolon, "Expect ';' after 'for' loop condition.");

    Expr? increment = null;
    if (!Check(TokenType.RightParen))
    {
      increment = Expression();
    }
    Consume(TokenType.RightParen, "Expect ')' after 'for' clauses.");

    var body = Statement();

    if (increment != null)
    {
      body = new Block(new()
      {
        body,
        new ExpressionStmt(increment)
      });
    }

    if (condition == null)
    {
      condition = new Literal(true);
    }
    body = new While(condition, body);

    if (initializer != null)
    {
      body = new Block(new()
      {
        initializer,
        body
      });
    }

    return body;
  }

  private Stmt IfStatement()
  {
    Consume(TokenType.LeftParen, "Expect '(' after 'if'.");
    var condition = Expression();
    Consume(TokenType.RightParen, "Expect ')' after 'if'.");

    Stmt thenBranch = Statement();
    Stmt? elseBranch = null;
    if (Match(TokenType.Else))
    {
      elseBranch = Statement();
    }

    return new If(condition, thenBranch, elseBranch);
  }

  private Stmt PrintStatement()
  {
    var value = Expression();
    Consume(TokenType.Semicolon, "Expect ';' after value.");
    return new Print(value);
  }

  private Stmt ReturnStatement()
  {
    var keyword = Previous();
    Expr? value = null;
    if (!Check(TokenType.Semicolon))
    {
      value = Expression();
    }

    Consume(TokenType.Semicolon, "Expect ';' after return value.");
    return new Return(keyword, value);
  }

  private Stmt WhileStatement()
  {
    Consume(TokenType.LeftParen, "Expect '(' after 'while'.");
    var condition = Expression();
    Consume(TokenType.RightParen, "Expect '(' after condition.");
    var body = Statement();
    return new While(condition, body);        
  }

  private Stmt ClassDeclaration()
  {
    var name = Consume(TokenType.Identifier, "Expect class name.");

    Variable? superclass = null;
    if (Match(TokenType.Less))
    {
      Consume(TokenType.Identifier, "Expect superclass name.");
      superclass = new Variable(Previous());
    }

    Consume(TokenType.LeftBrace, "Expect '{' before class body.");

    var methods = new List<Function>();
    while (!Check(TokenType.RightBrace) && !IsAtEnd())
    {
      methods.Add(Function("method"));
    }

    Consume(TokenType.RightBrace, "Expect '}' after class body.");

    return new ClassDecl(name, superclass, methods);
  }

  private Function Function(string kind)
  {
    var name = Consume(TokenType.Identifier, $"Expect {kind} name.");
    Consume(TokenType.LeftParen, $"Expect '(' after {kind} name.");
    
    var parameters = new List<Token>();
    if (!Check(TokenType.RightParen))
    {
      if (parameters.Count >= 255)
      {
        Error(Peek(), "Can't have more than 255 parameters.");
      }
      do
      {
        var param = Consume(TokenType.Identifier, "Expect parameter name.");
        parameters.Add(param);
      }
      while (Match(TokenType.Comma));
    }
    
    Consume(TokenType.RightParen, "Expect ')' after parameters.");
    Consume(TokenType.LeftBrace, $"Expect '{{' before {kind} body");

    var body = Block();

    return new Function(name, parameters, body);
  }

  private Stmt VarDeclaration()
  {
    var name = Consume(TokenType.Identifier, "Expect variable name.");

    Expr? initializer = null;
    if (Match(TokenType.Equal))
    {
      initializer = Expression();
    }

    Consume(TokenType.Semicolon, "Expect ';' after variable declaration.");
    return new Var(name, initializer);
  }

  private Stmt ExpressionStatement()
  {
    var expr = Expression();
    Consume(TokenType.Semicolon, "Expect ';' after expression");
    return new ExpressionStmt(expr);
  }

  private List<Stmt> Block()
  {
    var statements = new List<Stmt>();

    while (!Check(TokenType.RightBrace) && !IsAtEnd())
    {
      var decl = Declaration();
      if (decl != null)
      {
        statements.Add(decl);
      }
    }

    Consume(TokenType.RightBrace, "");
    return statements;
  }

  private Expr Assignment()
  {
    var expr = Or();

    if (Match(TokenType.Equal))
    {
      var equals = Previous();
      var value = Assignment();

      if (expr is Variable varExpr)
      {
        var name = varExpr.Name;
        return new Assign(name, value);
      }
      else if (expr is Get get)
      {
        return new Set(get.Object, get.Name, value);
      }

      Error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private Expr Or()
  {
    var expr = And();

    while (Match(TokenType.Or))
    {
      var @operator = Previous();
      var right = And();
      expr = new Logical(expr, @operator, right);
    }

    return expr;
  }

  private Expr And()
  {
    var expr = Equality();

    while (Match(TokenType.And))
    {
      var @operator = Previous();
      var right = Equality();
      expr = new Logical(expr, @operator, right);
    }

    return expr;
  }

  private Expr Equality()
  {
    var expr = Comparison();

    while (Match(TokenType.BangEqual, TokenType.EqualEqual))
    {
      var @operator = Previous();
      var right = Comparison();
      expr = new Binary(expr, @operator, right);
    }

    return expr;
  }

  private Expr Comparison()
  {
    var expr = Term();

    while (Match(TokenType.Greater, TokenType.GreaterEqual, TokenType.Less, TokenType.LessEqual))
    {
      var @operator = Previous();
      var right = Term();
      expr = new Binary(expr, @operator, right);
    }

    return expr;
  }

  private Expr Term()
  {
    var expr = Factor();

    while (Match(TokenType.Minus, TokenType.Plus))
    {
      var @operator = Previous();
      var right = Factor();
      expr = new Binary(expr, @operator, right);
    }

    return expr;
  }

  private Expr Factor()
  {
    var expr = Unary();

    while (Match(TokenType.Slash, TokenType.Star))
    {
      var @operator = Previous();
      var right = Unary();
      expr = new Binary(expr, @operator, right);
    }

    return expr;
  }

  private Expr Unary()
  {
    if (Match(TokenType.Bang, TokenType.Minus))
    {
      var @operator = Previous();
      var right = Unary();
      return new Unary(@operator, right);
    }

    return Call();
  }

  private Expr Call()
  {
    var expr = Primary();

    while (true)
    {
      if (Match(TokenType.LeftParen))
      {
        expr = FinishCall(expr);
      }
      else if (Match(TokenType.Dot))
      {
        var name = Consume(TokenType.Identifier, "Expect property name after '.'.");
        expr = new Get(expr, name);
      }
      else
      {
        break;
      }
    }

    return expr;
  }

  private Expr FinishCall(Expr callee)
  {
    var arguments = new List<Expr>();
    if (!Check(TokenType.RightParen))
    {
      do
      {
          if (arguments.Count >= 255)
          {
            Error(Peek(), "Can't have more than 255 arguments.");
          }
          arguments.Add(Expression());
      }
      while (Match(TokenType.Comma));
    }

    var paren = Consume(TokenType.RightParen, "Expect ')' after arguments.");

    return new Call(callee, paren, arguments);
  }

  private Expr Primary()
  {
    if (Match(TokenType.False))
    {
      return new Literal(false);
    }

    if (Match(TokenType.True))
    {
      return new Literal(true);
    }

    if (Match(TokenType.Nil))
    {
      return new Literal(null);
    }

    if (Match(TokenType.Super))
    {
      var keyword = Previous();
      Consume(TokenType.Dot, "Expect '.' after 'super'");
      var method = Consume(TokenType.Identifier, "Expect superclass method name.");
      return new Super(keyword, method);
    }

    if (Match(TokenType.Number, TokenType.String))
    {
      return new Literal(Previous().Literal);
    }

    if (Match(TokenType.This))
    {
      return new This(Previous());
    }

    if (Match(TokenType.Identifier))
    {
      return new Variable(Previous());
    }

    if (Match(TokenType.LeftParen))
    {
      var expr = Expression();
      Consume(TokenType.RightParen, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    var error = Error(Peek(), "Expect expression.");
    throw error;
  }

  private bool Match(params TokenType[] types)
  {
    foreach (var type in types)
    {
      if (Check(type))
      {
        Advance();
        return true;
      }
    }
    return false;
  }

  private bool Check(TokenType type)
  {
    if (IsAtEnd())
    {
      return false;
    }
    return Peek().Type == type;
  }

  private Token Advance()
  {
    if (!IsAtEnd())
    {
      current++;
    }
    return Previous();
  }

  private bool IsAtEnd() => Peek().Type == TokenType.Eof;

  private Token Peek()
  {
    return tokens[current];
  }

  private Token Previous()
  {
    return tokens[current - 1];
  }
  
  private Token Consume(TokenType type, string message)
  {
    if (Check(type))
    {
      return Advance();
    }

    var error = Error(Peek(), message);
    throw error;
  }

  private ParseError Error(Token token, string message)
  {
    Lox.Error(token, message);
    return new ParseError();
  }

  private void Synchronize()
  {
    Advance();

    while (!IsAtEnd())
    {
      if (Previous().Type == TokenType.Semicolon)
      {
        return;
      }

      switch (Peek().Type)
      {
        case TokenType.Class:
        case TokenType.For:
        case TokenType.Fun:
        case TokenType.If:
        case TokenType.Print:
        case TokenType.Return:
        case TokenType.Var:
        case TokenType.While:
          return;
      }

      Advance();
    }
  }
}
