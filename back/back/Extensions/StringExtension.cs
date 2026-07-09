using System.Text.RegularExpressions;

namespace back.Extensions
{
    public static partial class StringExtension
    {
        [GeneratedRegex("<[^>]*>", RegexOptions.Compiled)]
        private static partial Regex MyRegex();

            // Regex pour supprimer <script> ... </script>
            // Explication : 
            // <script[^>]*> -> Trouve la balise d'ouverture (avec ou sans attributs)
            // [\s\S]*?      -> Trouve n'importe quel caractère (y compris les retours à la ligne) de manière "paresseuse"
            // </script>     -> Trouve la balise de fermeture
        [GeneratedRegex(@"<script[^>]*>[\s\S]*?</script>", RegexOptions.IgnoreCase | RegexOptions.Compiled, "fr-FR")]
        private static partial Regex RegexHtmlScript();

        [GeneratedRegex(@"<style[^>]*>[\s\S]*?</style>", RegexOptions.IgnoreCase | RegexOptions.Compiled, "fr-FR")]
        private static partial Regex RegexHtmlStyle();

        public static string XSS(this string _valeur) => MyRegex().Replace(_valeur, "");

        public static string SupprimerScriptsEtStyles(this string htmlInput)
        {
            if (string.IsNullOrWhiteSpace(htmlInput))
                return htmlInput;

            string htmlSansScript = RegexHtmlScript().Replace(htmlInput, string.Empty);
            string htmlPropre = RegexHtmlStyle().Replace(htmlSansScript, string.Empty);

            return htmlPropre;
        }
    }
}
