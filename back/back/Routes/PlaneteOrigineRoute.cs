using back.Extensions;
using back.Models;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class PlaneteOrigineRoute
{
    public static RouteGroupBuilder AjouterRoutePlaneteOrigine(this RouteGroupBuilder builder)
    {
        builder.MapGet("lister", (Delegate)ListerAsync)
            .WithDescription("Lister les planetes")
            .Produces<PlaneteOrigine[]>();

        builder.MapPost("ajouter", AjouterAsync)
            .WithDescription("Ajouter une nouvelle planete")
            .ProducesCreated<int>();

        builder.MapPut("modifier/{idPlaneteOrigine:int}", ModifierAsync)
            .WithDescription("Modifier une nouvelle planete")
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapDelete("supprimer/{idPlaneteOrigine:int}", SupprimerAsync)
            .WithDescription("Supprimer une planete")
            .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> ListerAsync(
         HttpContext _httpContext
     )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var requete = db.GetCollection<PlaneteOrigine>().Query()
            .OrderBy(x => x.Nom)
            .Select(x => new PlaneteOrigine
            {
                 Id = x.Id,
                 Nom = x.Nom,
                 Description = x.Description,
                 NomFichier = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_PLANETE + x.NomFichier : ""
            }).ToArray();

        return Results.Extensions.Ok(requete, PlaneteOrigineContext.Default);
    }

    static async Task<IResult> AjouterAsync(
        [FromBody] PlaneteOrigineRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var col = db.GetCollection<PlaneteOrigine>();

        var grade = new PlaneteOrigine
        {
            Nom = _requete.Nom.XSS(),
            Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS()
        };

        int id = col.Insert(grade);

        return Results.Created("", id);
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idPlaneteOrigine")] int _idPlanete,
        [FromBody] PlaneteOrigineRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var ok = db.GetCollection<PlaneteOrigine>().UpdateMany(x => new()
        {
             Nom = _requete.Nom.XSS(),
             Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS()
        }, x => x.Id == _idPlanete);

        return ok > 0 ? Results.NoContent() : Results.NotFound("La planète n'existe pas");
    }

    static async Task<IResult> SupprimerAsync(
        [FromRoute(Name = "idPlaneteOrigine")] int _idPlanete
    )
    {
          if (_idPlanete <= 0)
               return Results.NotFound("La planete n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

          var planeteOrigineCol = db.GetCollection<PlaneteOrigine>();

          var nomFichier = planeteOrigineCol.Query()
               .Where(x => x.Id == _idPlanete)
               .Select(x => x.NomFichier)
               .FirstOrDefault();

          if (nomFichier is not null)
               File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_PLANETE + nomFichier));

          planeteOrigineCol.Delete(_idPlanete);

          db.GetCollection<Personnage>().UpdateMany(
                 x => new Personnage { PlaneteOrigine = null }, 
                 y => y.PlaneteOrigine != null && y.PlaneteOrigine.Id == _idPlanete
          );

        return Results.NoContent();
    }
}
