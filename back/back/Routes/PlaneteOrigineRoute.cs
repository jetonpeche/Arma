using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace back.Routes;

public static class PlaneteOrigineRoute
{
    public static RouteGroupBuilder AjouterRoutePlaneteOrigine(this RouteGroupBuilder builder)
    {
          builder.MapGet("lister", ListerAsync)
              .WithDescription("Lister les planetes")
              .Produces<PaginationReponse<PlaneteOrigine>>();

          builder.MapGet("lister-leger", ListerLegerAsync)
            .WithDescription("Lister les planetes aleger")
            .Produces<PlaneteOrigineLegerReponse[]>();

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
         HttpContext _httpContext,
         [FromQuery(Name = "thermeRecherche")] string _recherche = "",
         [FromQuery(Name = "page")] int _page = 1
    )
    {
          if (_page <= 1)
               _page = 1;

          using var db = new LiteDatabase(Constant.BDD_NOM);

          int total = db.GetCollection<HistoriqueCampagne>().Query().Count();

          var requete = db.GetCollection<PlaneteOrigine>().Query()
               .OrderBy(x => x.Nom);

          if (!string.IsNullOrWhiteSpace(_recherche))
               requete = requete.Where(x => x.Nom.ToLower().Contains(_recherche.ToLower()));

          var liste = requete.Select(x => new PlaneteOrigine
          {
               Id = x.Id,
               Nom = x.Nom,
               Description = x.Description,
               NomFichier = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_PLANETE + x.NomFichier : ""
          })
          .Offset((_page - 1) * 12)
          .Limit(12)
          .ToArray();

          return Results.Extensions.Ok(
               new PaginationReponse<PlaneteOrigine>
               {
                    Page = _page,
                    Total = total,
                    Liste = liste
               },
               PaginationReponseContext.Default);
    }

     static async Task<IResult> ListerLegerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var requete = db.GetCollection<PlaneteOrigine>().Query()
              .OrderBy(x => x.Nom)
              .Select(x => new PlaneteOrigineLegerReponse
              {
                   Id = x.Id,
                   Nom = x.Nom
              }).ToArray();

          return Results.Extensions.Ok(requete, PlaneteOrigineLegerReponseContext.Default);
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
