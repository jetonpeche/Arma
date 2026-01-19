using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class MaterielRoute
{
     public static RouteGroupBuilder AjouterRouteMateriel(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
              .WithDescription("Lister les matériels")
              .Produces<MaterielReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouveau matériel")
               .ProducesBadRequest()
               .ProducesNotFound()
               .ProducesCreated<int>();

          builder.MapPut("modifier/{idMateriel:int}", ModifierAsync)
               .WithDescription("Modifier un matériel")
               .ProducesBadRequest()
               .ProducesNotFound()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idMateriel:int}", SupprimerAsync)
               .WithDescription("Supprimer un matériel")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     static async Task<IResult> ListerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Materiel>().Query()
               .OrderBy(x => x.Prix)
               .Include(x => x.Type)
               .Select(x => new MaterielReponse
               {
                    Id = x.Id,
                    Nom = x.Nom,
                    Description = x.Description,
                    NbDetruit = x.NbDetruit,
                    NbPlacer = x.NbPlacer,
                    Prix = x.Prix,
                    Stock = x.Stock,
                    Type = new MaterielTypeReponse
                    {
                         Id = x.Type.Id,
                         Nom = x.Type.Nom
                    }
               })
               .ToArray();

          return Results.Extensions.Ok(liste, MaterielReponseContext.Default);
     }

     static async Task<IResult> AjouterAsync(
          [FromBody] MaterielRequete _requete
     )
     {
          if(_requete.IdTypeMateriel <= 0)
               return Results.NotFound("Le type n'existe pas");

          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_requete.Prix <= 0)
               return Results.BadRequest("Le prix doit être supérieur à zéro");

          if (_requete.NbDetruit < 0)
               return Results.BadRequest("Détruit doit être supérieur à zéro");

          if (_requete.NbPlacer < 0)
               return Results.BadRequest("Placé doit être supérieur à zéro");

          if (_requete.Stock < 0)
               return Results.BadRequest("Le stock doit être supérieur à zéro");

          using var db = new LiteDatabase (Constant.BDD_NOM);

          var materiel = new Materiel
          {
               Nom = _requete.Nom.XSS(),
               Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
               Prix = _requete.Prix,
               NbDetruit = _requete.NbDetruit,
               NbPlacer = _requete.NbPlacer,
               Stock = _requete.Stock
          };

          if (!db.GetCollection<MaterielType>().Exists(x => x.Id == _requete.IdTypeMateriel))
               return Results.NotFound("Le type n'existe pas");

          materiel.Type = new MaterielType { Id = _requete.IdTypeMateriel };

          int id = db.GetCollection<Materiel>().Insert (materiel).AsInt32;

          return Results.Created("", id);
     }

     static async Task<IResult> ModifierAsync(
          [FromBody] MaterielRequete _requete,
          [FromRoute(Name = "idMateriel")] int _idMateriel
     )
     {
          if (_idMateriel <= 0)
               return Results.NotFound("Le matériel n'existe pas");

          if (_requete.IdTypeMateriel <= 0)
               return Results.NotFound("Le type n'existe pas");

          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_requete.Prix <= 0)
               return Results.BadRequest("Le prix doit être supérieur à zéro");

          if (_requete.NbDetruit < 0)
               return Results.BadRequest("Détruit doit être supérieur à zéro");

          if (_requete.NbPlacer < 0)
               return Results.BadRequest("Placé doit être supérieur à zéro");

          if (_requete.Stock < 0)
               return Results.BadRequest("Le stock doit être supérieur à zéro");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var materiel = new Materiel
          {
               Id = _idMateriel,
               Nom = _requete.Nom.XSS(),
               Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
               Prix = _requete.Prix,
               NbDetruit = _requete.NbDetruit,
               NbPlacer = _requete.NbPlacer,
               Stock = _requete.Stock
          };

          if (!db.GetCollection<MaterielType>().Exists(x => x.Id == _requete.IdTypeMateriel))
               return Results.NotFound("Le type n'existe pas");

          materiel.Type = new MaterielType { Id = _requete.IdTypeMateriel };

          bool ok = db.GetCollection<Materiel>().Update(materiel);

          return ok ? Results.NoContent() : Results.NotFound("Le matériel n'existe pas");
     }

     static async Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idMateriel")] int _idMateriel
     )
     {
          if (_idMateriel <= 0)
               return Results.NotFound("Le matériel n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          bool ok = db.GetCollection<Materiel>().Delete(_idMateriel);

          return ok ? Results.NoContent() : Results.NotFound("Le matériel n'existe pas");
     }
}
