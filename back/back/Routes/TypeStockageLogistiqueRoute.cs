using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

 static class TypeStockageLogistiqueRoute
{
     public static RouteGroupBuilder AjouterRouteTypeStockageLogistique(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
              .WithDescription("Lister les types de stockage de la logistique")
              .Produces<TypeStockageLogistiqueReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouveau type de stockage de la logistique")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPut("modifier/{idTypeStokageLogistique:int}", ModifierAsync)
               .WithDescription("Modifier un type de stockage de la logistique")
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idTypeStokageLogistique:int}", SupprimerAsync)
               .WithDescription("Supprimer un type de stockage de la logistique")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     async static Task<IResult> ListerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<TypeStockageLogistique>()
               .Query()
               .Select(x => new TypeStockageLogistiqueReponse
               {
                    Id = x.Id,
                    Nom = x.Nom
               })
               .ToArray();

          return Results.Extensions.Ok(liste, TypeStockageLogistiqueReponseContext.Default);
     }

     async static Task<IResult> AjouterAsync(
          [FromBody] LogistiqueTypeRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var type = new TypeStockageLogistique
          {
               Nom = _requete.Nom.XSS()
          };

          int id = db.GetCollection<TypeStockageLogistique>().Insert(type).AsInt32;

          return Results.Created("", id);
     }

     async static Task<IResult> ModifierAsync(
          [FromBody] LogistiqueTypeRequete _requete,
          [FromRoute(Name = "idTypeStokageLogistique")] int _idTypeStokageLogistique
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_idTypeStokageLogistique <= 0)
               return Results.NotFound("Le type de stockage n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var type = new TypeStockageLogistique
          {
               Id = _idTypeStokageLogistique,
               Nom = _requete.Nom.XSS()
          };

          var ok = db.GetCollection<TypeStockageLogistique>().Update(type);

          return ok ? Results.NoContent() : Results.NotFound("Le type de stockage n'existe pas");
     }

     async static Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idTypeStokageLogistique")] int _idTypeStokageLogistique
     )
     {
          if (_idTypeStokageLogistique <= 0)
               return Results.NotFound("Le type de stockage n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var ok = db.GetCollection<TypeStockageLogistique>().Delete(_idTypeStokageLogistique);

          return ok ? Results.NoContent() : Results.NotFound("Le type de stockage n'existe pas");
     }
}
