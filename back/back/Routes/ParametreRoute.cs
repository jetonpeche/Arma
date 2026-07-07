using back.Extensions;
using back.Models;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class ParametreRoute
{
    public static RouteGroupBuilder AjouterRouteParametre(this RouteGroupBuilder builder)
    {
        builder.MapPut("modifier", ModifierAsync)
            .WithDescription("Modifier les paramètres du personnage")
            .ProducesNoContent()
            .ProducesNotFound();

        return builder;
    }

    async static Task<IResult> ModifierAsync(
        HttpContext _httpContext,
        [FromBody] Parametre _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var idPersonnage = _httpContext.RecupererIdPersonnage();  
        var ok = db.GetCollection<Personnage>()
            .UpdateMany(_ => new Personnage
            {
                Parametre = new()
                {
                    SonActiver = _requete.SonActiver,
                    ThemeSombreActiver = _requete.ThemeSombreActiver,
                    Volume = _requete.Volume < 0 ? 0 : _requete.Volume
                }
            }, x => x.Id == idPersonnage);
               
        return ok > 0 ? Results.NoContent() : Results.NotFound();
    }
}
