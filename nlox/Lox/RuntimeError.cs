class RuntimeError : Exception
{
  public Token Token { get; init; }

  public RuntimeError(Token token, string message) : base(message)
  {
    Token = token;
  }
}
