using System.Security.Claims;

namespace back.Extensions
{
    public static class HttpContextExtension
    {
          /// <summary>
          /// Recupere l'id du personnage connecté dans le JWT
          /// </summary>
          /// <param name="_httpContext"></param>
          /// <returns>Id publique de l'utilisateur</returns>
          public static int RecupererIdPersonnage(this HttpContext _httpContext) => 1; //int.Parse(_httpContext.User.FindFirstValue("id")!);

        /// <summary>
        /// Recupere le role de l'utilisateur dans le JWT
        /// </summary>
        /// <param name="_httpContext"></param>
        /// <returns>Role de l'utilsiateur</returns>
        public static string RecupererRole(this HttpContext _httpContext) => _httpContext.User.FindFirstValue(ClaimTypes.Role)!;
    }
}
