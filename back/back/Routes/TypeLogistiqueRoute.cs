using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class TypeLogistiqueRoute
{
     public static RouteGroupBuilder AjouterRouteTypeLogistique(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
              .WithDescription("Lister les types de la logistique")
              .Produces<LogistiqueTypeReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouveau type de logistique")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPut("modifier/{idTypeLogistique:int}", ModifierAsync)
               .WithDescription("Modifier un type de logistique")
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idTypeLogistique:int}", SupprimerAsync)
               .WithDescription("Supprimer un type de logistique")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     async static Task<IResult> ListerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<LogistiqueType>()
               .Query()
               .Select(x => new LogistiqueTypeReponse
               {
                    Id = x.Id,
                    Nom = x.Nom
               })
               .ToArray();

          return Results.Extensions.Ok(liste, LogistiqueTypeReponseContext.Default);
     }

     async static Task<IResult> AjouterAsync(
          [FromBody] LogistiqueTypeRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var type = new LogistiqueType
          {
               Nom = _requete.Nom.XSS()
          };

          int id = db.GetCollection<LogistiqueType>().Insert(type).AsInt32;

          return Results.Created("", id);
     }

     async static Task<IResult> ModifierAsync(
          [FromBody] LogistiqueTypeRequete _requete,
          [FromRoute(Name = "idTypeLogistique")] int _idTypeLogistique
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_idTypeLogistique <= 0)
               return Results.NotFound("Le type n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var type = new LogistiqueType
          {
               Id = _idTypeLogistique,
               Nom = _requete.Nom.XSS()
          };

          var ok = db.GetCollection<LogistiqueType>().Update(type);

          return ok ? Results.NoContent() : Results.NotFound("Le type n'existe pas");
     }

     async static Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idTypeLogistique")] int _idTypeLogistique
     )
     {
          if (_idTypeLogistique <= 0)
               return Results.NotFound("Le type n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var ok = db.GetCollection<LogistiqueType>().Delete(_idTypeLogistique);

          return ok ? Results.NoContent() : Results.NotFound("Le type n'existe pas");
     }
}
