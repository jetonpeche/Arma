using LiteDB;
using Services.Jwts;
using System.Security.Claims;

namespace back.Routes;

public static class testRoute
{
    public static RouteGroupBuilder AjouterTestRoute(this RouteGroupBuilder builder)
    {
        builder.MapGet("jwt", (IJwtService _jwtServ) =>
        {
            return Results.Ok(_jwtServ.Generer([
                new Claim("idUtilisateur", "1")
            ]));
        });

        builder.MapGet("securise", () =>
        {
            return Results.Ok("coucou");
        })
        .RequireAuthorization();

        return builder;
    }
}
