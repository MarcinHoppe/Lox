class LoxClass : LoxCallable
{
  private string name;
  private LoxClass? superclass;
  private Dictionary<string, LoxFunction> methods;

  public LoxClass(string name, LoxClass? superclass, Dictionary<string, LoxFunction> methods)
  {
    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }

  public LoxFunction? FindMethod(string name)
  {
    if (methods.TryGetValue(name, out LoxFunction? method))
    {
      return method;
    }
    if (superclass != null)
    {
      return superclass.FindMethod(name);
    }
    return null;
  }

  public int Arity => FindMethod("init")?.Arity ?? 0;

  public object? Call(Interpreter interpreter, List<object?> arguments)
  {
    var instance = new LoxInstance(this);
    var initializer = FindMethod("init");
    if (initializer != null)
    {
      initializer.Bind(instance).Call(interpreter, arguments);
    }
    return instance;
  }

  public override string ToString()
  {
    return this.name;
  }
}
