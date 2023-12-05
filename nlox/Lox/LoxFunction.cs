class LoxFunction : LoxCallable
{
  private Function declaration;
  private Environment closure;
  private bool isInitializer;

  public LoxFunction(Function declaration, Environment closure, bool isInitializer)
  {
    this.declaration = declaration;
    this.closure = closure;
    this.isInitializer = isInitializer;
  }

  public LoxFunction Bind(LoxInstance instance)
  {
    var environment = new Environment(closure);
    environment.Define("this", instance);
    return new LoxFunction(declaration, environment, isInitializer);
  }

  public int Arity => declaration.Params.Count;

  public object? Call(Interpreter interpreter, List<object?> arguments)
  {
    var environment = new Environment(closure);
    for (int i = 0; i < declaration.Params.Count; i++)
    {
      environment.Define(declaration.Params[i].Lexeme, arguments[i]);
    }

    try
    {
      interpreter.Execute(declaration.Body, environment);
    }
    catch (ReturnException retVal)
    {
      if (isInitializer)
      {
        return closure.GetAt(0, "this");
      }

      return retVal.Value;
    }

    if (isInitializer)
    {
      return closure.GetAt(0, "this");
    }
    
    return null;
  }

  public override string ToString() => $"<fn {declaration.Name.Lexeme} >";
}
