using System.Text;

static class AstPrinter
{
  public static string Print(this Expr expr)
  {
    return expr switch
    {
      Binary binary     => Parenthesize(binary.Operator.Lexeme, binary.Left, binary.Right),
      Grouping grouping => Parenthesize("group", grouping.Expression),
      Literal literal   => literal.Value?.ToString() ?? "nil",
      Unary unary       => Parenthesize(unary.Operator.Lexeme, unary.Right),
      _                 => throw new Exception("Unknown expression type")
    };
  }

  private static string Parenthesize(string name, params Expr[] exprs)
  {
    var builder = new StringBuilder();
    builder.Append("(");
    builder.Append(name);
    foreach (var expr in exprs)
    {
      builder.Append(" ");
      builder.Append(expr.Print());
    }
    builder.Append(")");
    return builder.ToString();
  }
}
