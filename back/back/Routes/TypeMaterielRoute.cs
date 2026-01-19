using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class TypeMaterielRoute
{
     public static RouteGroupBuilder AjouterRouteTypeMateriel(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
              .WithDescription("Lister les types du matériel")
              .Produces<TypeMaterielReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouveau type de matériel")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPut("modifier/{idTypeMateriel:int}", ModifierAsync)
               .WithDescription("Modifier un type de matériel")
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idTypeMateriel:int}", SupprimerAsync)
               .WithDescription("Supprimer un type de matériel")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     async static Task<IResult> ListerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<MaterielType>()
               .Query()
               .Select(x => new TypeMaterielReponse
               {
                    Id = x.Id,
                    Nom = x.Nom
               })
               .ToArray();

          return Results.Extensions.Ok(liste, TypeMaterielReponseContext.Default);
     }

     async static Task<IResult> AjouterAsync(
          [FromBody] LogistiqueTypeRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var type = new MaterielType
          {
               Nom = _requete.Nom.XSS()
          };

          int id = db.GetCollection<MaterielType>().Insert(type).AsInt32;

          return Results.Created("", id);
     }

     async static Task<IResult> ModifierAsync(
          [FromBody] LogistiqueTypeRequete _requete,
          [FromRoute(Name = "idTypeMateriel")] int _idTypeMateriel
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_idTypeMateriel <= 0)
               return Results.NotFound("Le type n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var type = new MaterielType
          {
               Id = _idTypeMateriel,
               Nom = _requete.Nom.XSS()
          };

          var ok = db.GetCollection<MaterielType>().Update(type);

          return ok ? Results.NoContent() : Results.NotFound("Le type n'existe pas");
     }

     async static Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idTypeMateriel")] int _idTypeMateriel
     )
     {
          if (_idTypeMateriel <= 0)
               return Results.NotFound("Le type n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var ok = db.GetCollection<MaterielType>().Delete(_idTypeMateriel);

          return ok ? Results.NoContent() : Results.NotFound("Le type n'existe pas");
     }
}
