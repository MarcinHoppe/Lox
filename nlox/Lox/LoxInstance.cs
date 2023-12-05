class LoxInstance
{
  private LoxClass @class;
  private Dictionary<string, object?> fields = new();

  public LoxInstance(LoxClass @class)
  {
    this.@class = @class;
  }

  public object? Get(Token name)
  {
    if (fields.TryGetValue(name.Lexeme, out object? value))
    {
      return value;
    }

    var method = @class.FindMethod(name.Lexeme);
    if (method != null)
    {
      return method.Bind(this);
    }

    throw new RuntimeError(name, $"Undefined property {name.Lexeme}.");
  }

  public void Set(Token name, object? value)
  {
    fields[name.Lexeme] = value;
  }

  public override string ToString()
  {
    return $"{@class} instance";
  }
}
