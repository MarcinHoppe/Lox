class Scanner
{
  private string source;
  private List<Token> tokens = new List<Token>();

  private int start = 0;
  private int current = 0;
  private int line = 1;

  private static Dictionary<string, TokenType> keywords = new Dictionary<string, TokenType>
  {
    { "and",    TokenType.And },
    { "class",  TokenType.Class },
    { "else",   TokenType.Else },
    { "false",  TokenType.False },
    { "for",    TokenType.For },
    { "fun",    TokenType.Fun },
    { "if",     TokenType.If },
    { "nil",    TokenType.Nil },
    { "or",     TokenType.Or },
    { "print",  TokenType.Print },
    { "return", TokenType.Return },
    { "super",  TokenType.Super },
    { "this",   TokenType.This },
    { "true",   TokenType.True },
    { "var",    TokenType.Var },
    { "while",  TokenType.While },
  };

  public Scanner(string source)
  {
    this.source = source;
  }

  public List<Token> ScanTokens()
  {
    while (!IsAtEnd())
    {
      start = current;
      ScanToken();
    }

    tokens.Add(new Token(TokenType.Eof, "", null, line));

    return tokens;
  }

  private void ScanToken()
  {
    var c = Advance();
    switch (c)
    {
      case '(':
        AddToken(TokenType.LeftParen);
        break;
      case ')':
        AddToken(TokenType.RightParen);
        break;
      case '{':
        AddToken(TokenType.LeftBrace);
        break;
      case '}':
        AddToken(TokenType.RightBrace);
        break;
      case ',':
        AddToken(TokenType.Comma);
        break;
      case '.':
        AddToken(TokenType.Dot);
        break;
      case '-':
        AddToken(TokenType.Minus);
        break;
      case '+':
        AddToken(TokenType.Plus);
        break;
      case ';':
        AddToken(TokenType.Semicolon);
        break;
      case '*':
        AddToken(TokenType.Star);
        break;
      case '!':
        AddToken(Match('=') ? TokenType.BangEqual : TokenType.Bang);
        break;
      case '=':
        AddToken(Match('=') ? TokenType.EqualEqual : TokenType.Equal);
        break;
      case '<':
        AddToken(Match('=') ? TokenType.LessEqual : TokenType.Less);
        break;
      case '>':
        AddToken(Match('=') ? TokenType.GreaterEqual : TokenType.Greater);
        break;
      case '/':
        if (Match('/'))
        {
          // A comment goes until the end of the line
          while (Peek() != '\n' && !IsAtEnd())
          {
            Advance();
          }
        }
        else
        {
          AddToken(TokenType.Slash);
        }
        break;
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace.
        break;
      case '\n':
        line++;
        break;
      case '"':
        StringToken();
        break;
      case 'o':
        if (Match('r'))
        {
          AddToken(TokenType.Or);
        }
        break;
      default:
        if (IsDigit(c))
        {
          NumberToken();
        }
        else if (IsAlpha(c))
        {
          IdentifierToken();
        }
        else
        {
          Lox.Error(line, "Unexpected character.");
        }
        break;
    }
  }

  private bool IsAtEnd() => current >= source.Length;

  private char Advance()
  {
    return source[current++];
  }

  private bool Match(char c)
  {
    if (IsAtEnd())
    {
      return false;
    }
    if (source[current] != c)
    {
      return false;
    }

    current++;
    return true;
  }

  private char Peek()
  {
    if (IsAtEnd())
    {
      return '\0';
    }
    return source[current];
  }

  private char PeekNext()
  {
    if (current + 1 >= source.Length)
    {
      return '\0';
    }
    return source[current + 1];
  }

  private static bool IsDigit(char c) =>
    c >= '0' && c <= '9';

  private static bool IsAlpha(char c) =>
    (c >= 'a' && c <= 'z') ||
    (c >= 'A' && c <= 'Z') ||
    (c == '_');

  private static bool IsAlphaNumeric(char c) =>
    IsDigit(c) || IsAlpha(c);

  private void AddToken(TokenType type)
  {
    AddToken(type, null);
  }

  private void AddToken(TokenType type, Object? literal)
  {
    var text = source.Substring(start, current - start);
    tokens.Add(new Token(type, text, literal, line));
  }

  private void StringToken()
  {
    while (Peek() != '"' && !IsAtEnd())
    {
      if (Peek() == '\n')
      {
        line++;
      }
      Advance();
    }

    if (IsAtEnd())
    {
      Lox.Error(line, "Unterminated string.");
      return;
    }

    // The closing '"'.
    Advance();

    // Trim the surrounding quotes.
    var value = source.Substring(start + 1, current - start - 2);
    AddToken(TokenType.String, value);
  }

  private void NumberToken()
  {
    while (IsDigit(Peek()))
    {
      Advance();
    }

    // Look for a fractional part.
    if (Peek() == '.' && IsDigit(PeekNext()))
    {
      // Consume the '.'.
      Advance();

      while (IsDigit(Peek()))
      {
        Advance();
      }
    }

    var value = source.Substring(start, current - start);
    AddToken(TokenType.Number, Double.Parse(value));
  }

  private void IdentifierToken()
  {
    while (IsAlphaNumeric(Peek()))
    {
      Advance();
    }

    var text = source.Substring(start, current - start);
    var type = TokenType.Identifier;
    if (keywords.ContainsKey(text))
    {
      type = keywords[text];
    }
    AddToken(type);
  }
}
