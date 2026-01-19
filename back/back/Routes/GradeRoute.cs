using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class GradeRoute
{
    public static RouteGroupBuilder AjouterRouteGrade(this RouteGroupBuilder builder)
    {
        builder.MapGet("lister", ListerAsync)
            .WithDescription("Lister les grades")
            .Produces<GradeReponse[]>();

        builder.MapPost("ajouter", AjouterAsync)
            .WithDescription("Ajouter un nouveau grade")
            .ProducesCreated<int>();

        builder.MapPut("modifier/{idGrade:int}", ModifierAsync)
            .WithDescription("Modifier un grade")
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapDelete("supprimer/{idGrade:int}", SupprimerAsync)
            .WithDescription("Supprimer un grade")
            .ProducesNotFound()
            .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> ListerAsync(
        [FromQuery(Name = "leger")] bool _modeLeger,
        HttpContext _httpContext
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var requete = db.GetCollection<Grade>().Query()
            .OrderBy(x => x.Ordre);

        if(_modeLeger)
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

        var liste = requete.Select(x => new GradeReponse
        {
            Id = x.Id,
            Conserne = x.Conserne,
            CandidatureRequise = x.CandidatureRequise,
            EstHonorifique = x.EstHonorifique,
            Fonction = x.Fonction,
            NbOperationRequis = x.NbOperationRequis,
            NbPlace = x.NbPlace,
            Nom = x.Nom,
            Ordre = x.Ordre,
            UrlFichierIcone = x.NomFichierIcone != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_GRADE + x.NomFichierIcone : ""
        }).ToArray();

        return Results.Extensions.Ok(liste, GradeReponseContext.Default);
    }

    static async Task<IResult> AjouterAsync(
        [FromBody] GradeRequete _requete
    )
    {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_requete.Fonction is not null && string.IsNullOrWhiteSpace(_requete.Fonction))
               return Results.BadRequest("La fonction ne peut pas être vide");

          if (_requete.NbPlace < 0)
               return Results.BadRequest("Le nombre de place ne peut pas être inférieur à zéro");

          if (_requete.NbPointBoutiqueGagnerParOperation < 0)
               return Results.BadRequest("Le nombre de point ne peut pas être inférieur à zéro");

          using var db = new LiteDatabase(Constant.BDD_NOM);

        var col = db.GetCollection<Grade>();

        var grade = new Grade
        {
            Nom = _requete.Nom.XSS(),
            Fonction = _requete.Fonction?.XSS(),
            Ordre = _requete.Ordre,
            NbOperationRequis = _requete.NbOperationRequis,
            NbPlace = _requete.NbPlace,
            Conserne = _requete.Conserne,
            EstHonorifique = _requete.EstHonorifique,
            NbPointBoutiqueGagnerParOperation = _requete.NbPointBoutiqueGagnerParOperation,
            CandidatureRequise = _requete.CandidatureRequise
        };

        int id = col.Insert(grade);

        return Results.Created("", id);
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idGrade")] int _idGrade,
        [FromBody] GradeRequete _requete
    )
    {
          if (_idGrade <= 0)
               return Results.NotFound("Le grade n'existe pas");

          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_requete.Fonction is not null && string.IsNullOrWhiteSpace(_requete.Fonction))
               return Results.BadRequest("La fonction ne peut pas être vide");

          if (_requete.NbPlace < 0)
               return Results.BadRequest("Le nombre de place ne peut pas être inférieur à zéro");

          if (_requete.NbPointBoutiqueGagnerParOperation < 0)
               return Results.BadRequest("Le nombre de point ne peut pas être inférieur à zéro");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var fonction = _requete.Fonction?.XSS();

          var nb = db.GetCollection<Grade>().UpdateMany(x => new Grade
          {
               Nom = _requete.Nom.XSS(),
               Fonction = fonction,
               Ordre = _requete.Ordre,
               NbOperationRequis = _requete.NbOperationRequis,
               NbPlace = _requete.NbPlace,
               Conserne = _requete.Conserne,
               EstHonorifique = _requete.EstHonorifique,
               NbPointBoutiqueGagnerParOperation = _requete.NbPointBoutiqueGagnerParOperation,
               CandidatureRequise = _requete.CandidatureRequise
          },
          x => x.Id == _idGrade);

        return nb > 0 ? Results.NoContent() : Results.NotFound("Le grade n'existe pas");
    }

    static async Task<IResult> SupprimerAsync(
        [FromRoute(Name = "idGrade")] int _idGrade
    )
    {
          if (_idGrade <= 0)
               return Results.NotFound("Le grade n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        bool ok = db.GetCollection<Grade>().Delete(_idGrade);
        db.GetCollection<Personnage>().UpdateMany(x => new Personnage { Grade = null }, y => y.Grade != null && y.Grade.Id == _idGrade);

        return ok ? Results.NoContent() : Results.NotFound("Le grade n'existe pas");
     }
}
