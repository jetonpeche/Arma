using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;

namespace back.Extensions
{
    public static class RouteExtension
    {
        /// <summary>
        /// Ajout d'un vérification des regles d'authorizations. OU logique  
        /// Au moins une règle doit être valide
        /// </summary>
        /// <param name="builder"></param>
        /// <param name="_listeRole">Nom des règles à tester</param>
        /// <returns>Le builder de la route pour chaînage</returns>
        public static IEndpointConventionBuilder RequireAuthorizationOr(this IEndpointConventionBuilder builder, params string[] _listeRole)
        {
            return builder.AddEndpointFilter(async (context, next) =>
            {
                var httpContext = context.HttpContext;

                // forcer l'authentification
                if (httpContext.User.Identity?.IsAuthenticated == false)
                    await httpContext.AuthenticateAsync();

                if (httpContext.User.Identity?.IsAuthenticated == false)
                    return Results.Forbid();

                var authService = httpContext.RequestServices.GetRequiredService<IAuthorizationService>();

                foreach (var element in _listeRole)
                {
                    var result = await authService.AuthorizeAsync(httpContext.User, element);

                    if (result.Succeeded)
                        return await next(context);
                }

                return Results.Forbid();
            });
        }
    }
}
