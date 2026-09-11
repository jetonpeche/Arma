using back.Enums;
using back.Extensions;
using back.Models;
using back.ModelsImport.BatailleSpatials;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class SessionRoute
{
    public static RouteGroupBuilder AjouterRouteSession(this RouteGroupBuilder builder)
    {
        builder.MapPost("initialiser", CreerAsync)
            .WithDescription("Creer une session")
            .ProducesNoContent();

            return builder;
    }

    static async Task<IResult> CreerAsync(
        [FromBody] CreerSessionRequete _requete 
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        string nomImageCarte = "";
        if (_requete.ImageCarte is not null)
        {
            nomImageCarte = $"{Guid.NewGuid()}{Path.GetExtension(_requete.ImageCarte.FileName)}";
            File.Create();
        }

        

        var session = new CombatSession
        {
            Hauteur = _requete.Hauteur,
            Largeur = _requete.Largeur,
            NomPartie = _requete.Nom.XSS(),
            NomImageCarte = nomImageCarte,
            ListeDecorSurCarte
        };


        return Results.NoContent();
    }
}
