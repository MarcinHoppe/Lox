class ClockFunction : LoxCallable
{
  public int Arity => 0;

  public object? Call(Interpreter interpreter, List<object?> arguments)
  {
    return (double) DateTimeOffset.Now.ToUnixTimeSeconds();
  }

  public override string ToString() => "<native fn>";
}
