using System.Text.RegularExpressions;

namespace back.Extensions
{
    public static class StringExtension
    {
          public static string XSS(this string _valeur) => Regex.Replace(_valeur, "<[^>]*>", "", RegexOptions.Compiled);
    }
}
