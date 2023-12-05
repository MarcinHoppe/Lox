class Interpreter
{
  private readonly Environment globals = new();
  private Environment environment;
  private Dictionary<Expr, int> locals = new();

  public Interpreter()
  {
    environment = globals;
    globals.Define("clock", new ClockFunction());
  }

  public void Interpret(List<Stmt> statements)
  {
    try
    {
      foreach(var statement in statements)
      {
        Execute(statement);
      }
    }
    catch (RuntimeError error)
    {
      Lox.RuntimeError(error);
    }
  }

  private object? Evaluate(Expr expr)
  {
    return expr switch
    {
      Literal literal   => literal.Value,
      Grouping grouping => Evaluate(grouping.Expression),
      Unary unary       => Evaluate(unary),
      Binary binary     => Evaluate(binary),
      Variable variable => LookupVariable(variable.Name, expr),
      Assign assign     => Evaluate(assign),
      Logical logical   => Evaluate(logical),
      Call call         => Evaluate(call),
      Get get           => Evaluate(get),
      Set set           => Evaluate(set),
      This @this        => Evaluate(@this),
      Super super       => Evaluate(super),
      _                 => throw new Exception("Unknown expression type")
    };
  }

  private void Execute(Stmt statement)
  {
    switch (statement)
    {
      case Print print:
        Execute(print);
        break;
      case ExpressionStmt expr:
        Execute(expr);
        break;
      case Var varStmt:
        Execute(varStmt);
        break;
      case Block block:
        Execute(block.Statements, new Environment(environment));
        break;
      case If @if:
        Execute(@if);
        break;
      case While @while:
        Execute(@while);
        break;
      case ClassDecl @class:
        Execute(@class);
        break;
      case Function function:
        Execute(function);
        break;
      case Return @return:
        Execute(@return);
        break;
      default:
        throw new Exception("Unknown statement");
    }
  }

  private void Execute(Print stmt)
  {
    var value = Evaluate(stmt.Expression);
    Console.WriteLine(ToString(value));
  }

  private void Execute(ExpressionStmt stmt)
  {
    Evaluate(stmt.Expression);
  }

  private void Execute(Var stmt)
  {
    object? value = null;
    if (stmt.Initializer != null)
    {
      value = Evaluate(stmt.Initializer);
    }
    environment.Define(stmt.Name.Lexeme, value);
  }

  public void Execute(List<Stmt> statements, Environment environment)
  {
    var previous = this.environment;
    try
    {
      this.environment = environment;
      
      foreach (var statement in statements)
      {
        Execute(statement);
      }
    }
    finally
    {
      this.environment = previous;
    }
  }

  private void Execute(If stmt)
  {
    if (IsTruthy(Evaluate(stmt.Condition)))
    {
      Execute(stmt.ThenBranch);
    }
    else if (stmt.ElseBranch != null)
    {
      Execute(stmt.ElseBranch);
    }
  }

  private void Execute(While stmt)
  {
    while (IsTruthy(Evaluate(stmt.Condition)))
    {
      Execute(stmt.Body);
    }
  }

  private void Execute(ClassDecl stmt)
  {
    object? superclass = null;
    if (stmt.Superclass != null)
    {
      superclass = Evaluate(stmt.Superclass);
      if (!(superclass is LoxClass))
      {
        throw new RuntimeError(stmt.Superclass.Name, "Superclass must be a class.");
      }
    }

    environment.Define(stmt.Name.Lexeme, null);

    if (stmt.Superclass != null)
    {
      environment = new Environment(environment);
      environment.Define("super", superclass);
    }

    var methods = new Dictionary<string, LoxFunction>();
    foreach (var method in stmt.Methods)
    {
      var isInitializer = method.Name.Lexeme == "init";
      var function = new LoxFunction(method, environment, isInitializer);
      methods[method.Name.Lexeme] = function;
    }

    LoxClass @class = new LoxClass(stmt.Name.Lexeme, superclass as LoxClass, methods);

    if (superclass != null)
    {
      environment = environment.Enclosing!;
    }

    environment.Assign(stmt.Name, @class);
  }

  private void Execute(Function stmt)
  {
    var function = new LoxFunction(stmt, environment, false);
    environment.Define(stmt.Name.Lexeme, function);
  }

  private void Execute(Return stmt)
  {
    object? value = null;
    if (stmt.Value != null)
    {
      value = Evaluate(stmt.Value);
    }

    throw new ReturnException() { Value = value };
  }

  public void Resolve(Expr expr, int depth)
  {
    locals[expr] = depth;
  }

  private object? Evaluate(Unary expr)
  {
    var right = Evaluate(expr.Right);

    switch (expr.Operator.Type)
    {
      case TokenType.Bang:
        return !IsTruthy(right);
      case TokenType.Minus:
        CheckNumberOperand(expr.Operator, right);
        return -(double)right!;
    };

    return null;
  }

  private object? Evaluate(Binary expr)
  {
    var left = Evaluate(expr.Left);
    var right = Evaluate(expr.Right);

    switch (expr.Operator.Type)
    {
      case TokenType.Greater:
        CheckNumberOperands(expr.Operator, left, right);
        return (double)left! > (double)right!;
      case TokenType.GreaterEqual:
        CheckNumberOperands(expr.Operator, left, right);
        return (double)left! >= (double)right!;
      case TokenType.Less:
        CheckNumberOperands(expr.Operator, left, right);
        return (double)left! < (double)right!;
      case TokenType.LessEqual:
        CheckNumberOperands(expr.Operator, left, right);
        return (double)left! <= (double)right!;
      case TokenType.BangEqual:
        return !IsEqual(left, right);
      case TokenType.EqualEqual:
        return IsEqual(left, right);
      case TokenType.Minus:
        CheckNumberOperands(expr.Operator, left, right);
        return (double)left! - (double)right!;
      case TokenType.Slash:
        CheckNumberOperands(expr.Operator, left, right);
        return (double)left! / (double)right!;
      case TokenType.Star:
        CheckNumberOperands(expr.Operator, left, right);
        return (double)left! * (double)right!;
      case TokenType.Plus:
        if (left is string && right is string)
        {
          return (string)left! + (string)right!;
        }
        if (left is Double && right is Double)
        {
          return (double)left! + (double)right!;
        }

        throw new RuntimeError(expr.Operator, "Operands must be two numbers or two strings.");
    }

    return null;
  }

  private object? Evaluate(Assign expr)
  {
    var value = Evaluate(expr.Value);

    if (locals.TryGetValue(expr, out int distance))
    {
      environment.AssignAt(distance, expr.Name, value);
    }
    else
    {
      globals.Assign(expr.Name, value);
    }
    return value;
  }

  private object? Evaluate(Logical expr)
  {
    var left = Evaluate(expr.Left);

    if (expr.Operator.Type == TokenType.Or)
    {
      if (IsTruthy(left))
      {
        return left;
      }
    }
    else
    {
      if (!IsTruthy(left))
      {
        return left;
      }
    }

    return Evaluate(expr.Right);
  }

  private object? Evaluate(Call expr)
  {
    var callee = Evaluate(expr.Callee);

    var arguments = new List<object?>();
    foreach (var argument in expr.Arguments)
    {
      arguments.Add(Evaluate(argument));
    }

    var function = callee as LoxCallable;
    if (function == null)
    {
      throw new RuntimeError(expr.Paren, "Can only call functions and classes.");
    }
    if (arguments.Count != function.Arity)
    {
      throw new RuntimeError(expr.Paren, $"Expected {function.Arity} arguments but got {arguments.Count}.");
    }
    return function.Call(this, arguments);
  }

  private object? Evaluate(Get expr)
  {
    var obj = Evaluate(expr.Object);
    if (obj is LoxInstance lobj)
    {
      return lobj.Get(expr.Name);
    }

    throw new RuntimeError(expr.Name, "Only instances have properties.");
  }

  private object? Evaluate(Set expr)
  {
    var obj = Evaluate(expr.Object);

    if (obj is LoxInstance lobj)
    {
      var value = Evaluate(expr.Value);
      lobj.Set(expr.Name, value);
      return value;
    }
    else
    {
      throw new RuntimeError(expr.Name, "Only instances have fields.");
    }
  }

  private object? Evaluate(This expr)
  {
    return LookupVariable(expr.Keyword, expr);
  }

  private object? Evaluate(Super expr)
  {
    int distance = locals[expr];
    var superclass = environment.GetAt(distance, "super") as LoxClass;
    var instance = environment.GetAt(distance - 1, "this") as LoxInstance;
    var method = superclass!.FindMethod(expr.Method.Lexeme);

    if (method == null)
    {
      throw new RuntimeError(expr.Method, $"Undefined property '{expr.Method.Lexeme}'.");
    }

    return method.Bind(instance!);
  }

  private object? LookupVariable(Token name, Expr expr)
  {
    if (locals.TryGetValue(expr, out int distance))
    {
      return environment.GetAt(distance, name.Lexeme);
    }
    else
    {
      return globals.Get(name);
    }
  }

  private static string ToString(object? obj)
  {
    if (obj == null)
    {
      return "nil";
    }

    if (obj is Double)
    {
      var text = obj.ToString()!;
      if (text.EndsWith(".0"))
      {
        text = text.Substring(0, text.Length - 2);
      }
      return text;
    }

    return obj.ToString()!;
  }

  private static bool IsTruthy(object? obj)
  {
    if (obj == null)
    {
      return false;
    }
    if (obj is Boolean)
    {
      return (bool)obj;
    }
    return true;
  }

  private static bool IsEqual(object? left, object? right)
  {
    if (left == null && right == null)
    {
      return true;
    }
    if (left == null)
    {
      return false;
    }
    return left.Equals(right);
  }

  private static void CheckNumberOperand(Token @operator, object? operand)
  {
    if (operand is Double)
    {
      return;
    }
    throw new RuntimeError(@operator, "Operand must be a number.");
  }

  private static void CheckNumberOperands(Token @operator, object? left, object? right)
  {
    if (left is Double && right is Double)
    {
      return;
    }
    throw new RuntimeError(@operator, "Operands must be numbers.");
  }
}
