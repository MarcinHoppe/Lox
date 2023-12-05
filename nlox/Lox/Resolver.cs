class Resolver
{
  private Interpreter interpreter;
  private List<Dictionary<string, bool>> scopes = new();
  private FunctionType currentFunction = FunctionType.None;
  private ClassType currentClass = ClassType.None;

  public Resolver(Interpreter interpreter)
  {
    this.interpreter = interpreter;
  }

  public void Resolve(List<Stmt> statements)
  {
    foreach (var stmt in statements)
    {
      Resolve(stmt);
    }
  }

  private void Resolve(Stmt stmt)
  {
    switch (stmt)
    {
      case Block block:
        Resolve(block);
        break;
      case ClassDecl @class:
        Resolve(@class);
        break;
      case Var var:
        Resolve(var);
        break;
      case Function function:
        Resolve(function);
        break;
      case ExpressionStmt exprStmt:
        Resolve(exprStmt);
        break;
      case If @if:
        Resolve(@if);
        break;
      case Print print:
        Resolve(print);
        break;
      case Return @return:
        Resolve(@return);
        break;
      case While @while:
        Resolve(@while);
        break;
      default:
        throw new Exception("Unknown statement");
    }
  }

  private void Resolve(Block stmt)
  {
    BeginScope();
    Resolve(stmt.Statements);
    EndScope();
  }

  private void Resolve(ClassDecl stmt)
  {
    var enclosingClass = currentClass;
    currentClass = ClassType.Class;

    Declare(stmt.Name);
    Define(stmt.Name);

    if (stmt.Superclass != null && stmt.Name.Lexeme == stmt.Superclass.Name.Lexeme)
    {
      Lox.Error(stmt.Superclass.Name, "A class can't inherit from itself.");
    }
    
    if (stmt.Superclass != null)
    {
      currentClass = ClassType.Subclass;
      Resolve(stmt.Superclass);
    }

    if (stmt.Superclass != null)
    {
      BeginScope();
      scopes.Last()["super"] = true;
    }

    BeginScope();
    scopes.Last()["this"] = true;

    foreach (var method in stmt.Methods)
    {
      var declaration = FunctionType.Method;
      if (method.Name.Lexeme == "init")
      {
        declaration = FunctionType.Initializer;
      }

      ResolveFunction(method, declaration);
    }

    EndScope();

    if (stmt.Superclass != null)
    {
      EndScope();
    }

    currentClass = enclosingClass;
  }

  private void Resolve(Var stmt)
  {
    Declare(stmt.Name);
    if (stmt.Initializer != null)
    {
      Resolve(stmt.Initializer);
    }
    Define(stmt.Name);
  }

  private void Resolve(Function stmt)
  {
    Declare(stmt.Name);
    Define(stmt.Name);
    ResolveFunction(stmt, FunctionType.Function);
  }

  private void ResolveFunction(Function function, FunctionType type)
  {
    var enclosingFunction = currentFunction;
    currentFunction = type;

    BeginScope();
    foreach (var param in function.Params)
    {
      Declare(param);
      Define(param);
    }
    Resolve(function.Body);
    EndScope();

    currentFunction = enclosingFunction;
  }

  private void Resolve(ExpressionStmt stmt)
  {
    Resolve(stmt.Expression);
  }

  private void Resolve(If stmt)
  {
    Resolve(stmt.Condition);
    Resolve(stmt.ThenBranch);
    if (stmt.ElseBranch != null)
    {
      Resolve(stmt.ElseBranch);
    }
  }

  private void Resolve(Print stmt)
  {
    Resolve(stmt.Expression);
  }

  private void Resolve(Return stmt)
  {
    if (currentFunction == FunctionType.None)
    {
      Lox.Error(stmt.Keyword, "Can't return from top-level code.");
    }

    if (stmt.Value != null)
    {
      if (currentFunction == FunctionType.Initializer)
      {
        Lox.Error(stmt.Keyword, "Can't return a value from an initializer.");
      }

      Resolve(stmt.Value);
    }
  }

  private void Resolve(While stmt)
  {
    Resolve(stmt.Condition);
    Resolve(stmt.Body);
  }

  private void Resolve(Expr expr)
  {
    switch (expr)
    {
      case Variable variable:
        Resolve(variable);
        break;
      case Assign assign:
        Resolve(assign);
        break;
      case Binary binary:
        Resolve(binary);
        break;
      case Call call:
        Resolve(call);
        break;
      case Grouping grouping:
        Resolve(grouping);
        break;
      case Literal _:
        break;
      case Logical logical:
        Resolve(logical);
        break;
      case Unary unary:
        Resolve(unary);
        break;
      case Get get:
        Resolve(get);
        break;
      case Set set:
        Resolve(set);
        break;
      case This @this:
        Resolve(@this);
        break;
      case Super super:
        Resolve(super);
        break;
      default:
        throw new Exception("Unknown expression");
    }
  }

  private void Resolve(Variable expr)
  {
    if (scopes.Count > 0 && scopes.Last().TryGetValue(expr.Name.Lexeme, out bool defined) && !defined)
    {
      Lox.Error(expr.Name, "Can't read local variable in its own initializer");
    }

    ResolveLocal(expr, expr.Name);
  }

  private void Resolve(Assign expr)
  {
    Resolve(expr.Value);
    ResolveLocal(expr, expr.Name);
  }

  private void Resolve(Binary expr)
  {
    Resolve(expr.Left);
    Resolve(expr.Right);
  }

  private void Resolve(Call expr)
  {
    Resolve(expr.Callee);
    foreach (var argument in expr.Arguments)
    {
      Resolve(argument);
    }
  }

  private void Resolve(Grouping expr)
  {
    Resolve(expr.Expression);
  }

  private void Resolve(Logical expr)
  {
    Resolve(expr.Left);
    Resolve(expr.Right);
  }

  private void Resolve(Unary expr)
  {
    Resolve(expr.Right);
  }

  private void Resolve(Get expr)
  {
    Resolve(expr.Object);
  }

  private void Resolve(Set expr)
  {
    Resolve(expr.Value);
    Resolve(expr.Object);
  }

  private void Resolve(This expr)
  {
    if (currentClass == ClassType.None)
    {
      Lox.Error(expr.Keyword, "Can't use 'this' outside of a class.");
    }

    ResolveLocal(expr, expr.Keyword);
  }

  private void Resolve(Super expr)
  {
    if (currentClass == ClassType.None)
    {
      Lox.Error(expr.Keyword, "Can't use 'super' outside of a class.");
    }
    else if (currentClass == ClassType.Class)
    {
      Lox.Error(expr.Keyword, "Can't use 'super' in a class with no superclass.");
    }

    ResolveLocal(expr, expr.Keyword);
  }

  private void ResolveLocal(Expr expr, Token name)
  {
    for (int i = scopes.Count - 1; i >= 0; i--)
    {
      if (scopes[i].ContainsKey(name.Lexeme))
      {
        interpreter.Resolve(expr, scopes.Count - 1 - i);
      }
    }
  }

  private void BeginScope()
  {
    scopes.Add(new Dictionary<string, bool>());
  }

  private void EndScope()
  {
    scopes.RemoveAt(scopes.Count - 1);
  }

  private void Declare(Token name)
  {
    if (scopes.Count == 0)
    {
      return;
    }
    var scope = scopes.Last();
    if (scope.ContainsKey(name.Lexeme))
    {
      Lox.Error(name, "There already is a variable with this name in this scope.");
    }
    
    scope[name.Lexeme] = false;
  }

  private void Define(Token name)
  {
    if (scopes.Count == 0)
    {
      return;
    }
    scopes.Last()[name.Lexeme] = true;
  }
}
