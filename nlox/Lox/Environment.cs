class Environment
{
  private Dictionary<string, object?> values = new Dictionary<string, object?>();

  public Environment() {}

  public Environment(Environment enclosing)
  {
    this.Enclosing = enclosing;
  }

  public Environment? Enclosing { get; init; }

  public void Define(string name, object? value)
  {
    values[name] = value;
  }

  public object? Get(Token name)
  {
    if (values.TryGetValue(name.Lexeme, out var value))
    {
      return value;
    }

    if (Enclosing != null)
    {
      return Enclosing.Get(name);
    }

    throw new RuntimeError(name, $"Undefined variable '{name.Lexeme}'");
  }

  public object? GetAt(int distance, string name)
  {
    var ancestor = Ancestor(distance)!;
    return ancestor.values[name];
  }

  private Environment? Ancestor(int distance)
  {
    var environment = this;
    for (int i = 0; i < distance; i++)
    {
      environment = environment?.Enclosing;
    }
    return environment;
  }

  public void Assign(Token name, object? value)
  {
    if (values.ContainsKey(name.Lexeme))
    {
      values[name.Lexeme] = value;
      return;
    }

    if (Enclosing != null)
    {
      Enclosing.Assign(name, value);
      return;
    }

    throw new RuntimeError(name, $"Undefined variable '{name.Lexeme}'");
  }

  public void AssignAt(int distance, Token name, object? value)
  {
    var ancestor = Ancestor(distance)!;
    ancestor.values[name.Lexeme] = value;
  }
}
