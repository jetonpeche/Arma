using back.Extensions;
using back.Models;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class SpecialiteRoute
{
    public static RouteGroupBuilder AjouterRouteSpecialite(this RouteGroupBuilder builder)
    {
          builder.MapGet("lister", ListerAsync)
              .WithDescription("Lister les spécialités");

        builder.MapPost("ajouter", AjouterAsync)
            .WithDescription("Ajouter une nouvelle spécialité")
            .ProducesCreated<int>();

        builder.MapPut("modifier/{idSpecialite:int}", ModifierAsync)
            .WithDescription("Modifier une spécialité")
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapDelete("supprimer/{idSpecialite:int}", SupprimerAsync)
            .WithDescription("Supprimer une spécialité")
            .ProducesNotFound()
            .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> ListerAsync([FromQuery(Name = "leger")] bool _modeLeger)
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var requete = db.GetCollection<Specialite>().Query()
            .OrderBy(x => x.Nom);

        if (_modeLeger)
        {
            return Results.Ok(
                requete.Select(x => new
                {
                    x.Id,
                    x.Nom
                })
                .ToArray()
            );
        }

        return Results.Ok(requete.ToArray());
    }

    static async Task<IResult> AjouterAsync(
        [FromBody] SpecialiteRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var col = db.GetCollection<Specialite>();

        var specialite = new Specialite
        {
            Nom = _requete.Nom.XSS(),
            Description = _requete.Description == "" ? null : _requete.Description?.XSS()
        };

        int id = col.Insert(specialite);

        return Results.Created("", id);
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idSpecialite")] int _idSpecialite,
        [FromBody] SpecialiteRequete _requete
    )
    {
          if (_idSpecialite <= 0)
               return Results.NotFound("La spécialité n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var specialite = new Specialite
        {
            Id = _idSpecialite,
            Nom = _requete.Nom.XSS(),
            Description = _requete.Description == "" ? null : _requete.Description?.XSS()
        };

        var ok = db.GetCollection<Specialite>().Update(specialite);

        return ok ? Results.NoContent() : Results.NotFound("La spécialité n'existe pas");
    }

    static async Task<IResult> SupprimerAsync(
        [FromRoute(Name = "idSpecialite")] int _idSpecialite
    )
    {
          if(_idSpecialite <= 0)
               return Results.NotFound("La spécialité n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          db.GetCollection<Specialite>().Delete(_idSpecialite);
          db.GetCollection<Personnage>().UpdateMany(
               x => new() { Specialite = null }, 
               y => y.Specialite != null && y.Specialite.Id == _idSpecialite
          );

          return Results.NoContent();
    }
}
