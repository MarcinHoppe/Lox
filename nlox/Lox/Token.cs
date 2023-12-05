record Token(TokenType Type, string Lexeme, Object? Literal, int Line)
{
  public override string ToString()
  {
    return $"{Type} {Lexeme} {Literal}";
  }
}
