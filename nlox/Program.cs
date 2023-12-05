static class Lox
{
  private static Interpreter interpreter = new();
  private static bool hadError = false;
  private static bool hadRuntimeError = false;

  static void Main(string[] args)
  {
    if (args.Length > 1)
    {
      Console.WriteLine("Usage: nlox [source]");
      System.Environment.Exit(64);
    }
    else if (args.Length == 1)
    {
      RunFile(args[0]);
    }
    else
    {
      RunPrompt();
    }
  }

  static void RunFile(string path)
  {
    var source = File.ReadAllText(path);

    Run(source);

    if (hadError)
    {
      
      System.Environment.Exit(65);
    }
    if (hadRuntimeError)
    {
      System.Environment.Exit(70);
    }
  }

  static void RunPrompt()
  {
    while (true)
    {
      Console.Write("> ");
      string? line = Console.ReadLine();
      if (line == null)
      {
        break;
      }

      Run(line);

      hadError = false;
    }
  }

  static void Run(string source)
  {
    var scanner = new Scanner(source);
    var tokens = scanner.ScanTokens();
    var parser = new Parser(tokens);
    var statements = parser.Parse();

    if (hadError)
    {
      return;
    }

    var resolver = new Resolver(interpreter);
    resolver.Resolve(statements);

    if (hadError)
    {
      return;
    }

    interpreter.Interpret(statements);
  }

  public static void Error(int line, string message)
  {
    Report(line, "", message);
  }

  private static void Report(int line, string where, string message)
  {
    Console.Error.WriteLine($"[{line}] Error{where}: {message}");
    hadError = true;
  }

  public static void Error(Token token, string message)
  {
    if (TokenType.Eof == token.Type)
    {
      Report(token.Line, " at end", message);
    }
    else
    {
      Report(token.Line, $" at '{token.Lexeme}'", message);
    }
  }

  public static void RuntimeError(RuntimeError error)
  {
    Console.Error.WriteLine($"{error.Message}\n[line {error.Token.Line}]");
    hadRuntimeError = true;
  }
}
