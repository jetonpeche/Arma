using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class LogistiqueRoute
{
     public static RouteGroupBuilder AjouterRouteLogistique(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
              .WithDescription("Lister les objets de la logistique")
              .Produces<LogistiqueReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouvelle objet à la logistique")
               .ProducesBadRequest()
               .ProducesNotFound()
               .ProducesCreated<int>();

          builder.MapPut("modifier/{idLogistique:int}", ModifierAsync)
               .WithDescription("Modifier un objet à la logistique")
               .ProducesBadRequest()
               .ProducesNotFound()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idLogistique:int}", SupprimerAsync)
               .WithDescription("Supprimer un objet de la logistique")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     async static Task<IResult> ListerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Logistique>()
               .Query()
               .Include(x => x.LogistiqueType)
               .Include(x => x.TypeStockage)
               .OrderBy(x => x.Prix)
               .Select(x => new LogistiqueReponse
               {
                    Id = x.Id,
                    Nom = x.Nom,
                    Prix = x.Prix,
                    NbDetruit = x.NbDetruit,
                    EstKit = x.EstKit,
                    IgnoreTypeStockage = x.IgnoreTypeStockage,
                    Stock = x.Stock,
                    TailleUnitaireInventaire = x.TailleUnitaireInventaire,
                    Type = new LogistiqueTypeReponse
                    {
                         Id = x.LogistiqueType.Id,
                         Nom = x.LogistiqueType.Nom
                    },
                    TypeStockage = new TypeStockageLogistiqueReponse
                    {
                         Id = x.TypeStockage.Id,
                         Nom = x.TypeStockage.Nom
                    }
               })
               .ToArray();

          return Results.Extensions.Ok(liste, LogistiqueReponseContext.Default);
     }

     async static Task<IResult> AjouterAsync(
          [FromBody] LogistiqueRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_requete.Prix <= 0)
               return Results.BadRequest("Le prix doit être supérieur à zéro");

          if (_requete.NbDetruit < 0)
               return Results.BadRequest("Détruit ne peut pas être négatif");

          if (_requete.Stock < 0)
               return Results.BadRequest("Le stock ne peut pas être négatif");

          if (_requete.TailleUnitaireInventaire < 0)
               return Results.BadRequest("La taille d'inventaire ne peut pas être négatif");

          if (_requete.IdType <= 0)
               return Results.BadRequest("Le type n'existe pas");

          if (_requete.IdTypeStockage <= 0)
               return Results.BadRequest("Le type de stockage n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var logistique = new Logistique
          {
               Nom = _requete.Nom.XSS(),
               Prix = _requete.Prix,
               IgnoreTypeStockage = _requete.IgnoreTypeStockage,
               EstKit = _requete.EstKit,
               NbDetruit = _requete.NbDetruit,
               Stock = _requete.Stock,
               TailleUnitaireInventaire = _requete.TailleUnitaireInventaire
          };

          if (!db.GetCollection<LogistiqueType>().Exists(x => x.Id == _requete.IdType))
               return Results.NotFound("Le type n'existe pas");

          if (!db.GetCollection<TypeStockageLogistique>().Exists(x => x.Id == _requete.IdTypeStockage))
               return Results.NotFound("Le type de stockage n'existe pas");

          logistique.LogistiqueType = new LogistiqueType { Id = _requete.IdType };
          logistique.TypeStockage = new TypeStockageLogistique { Id = _requete.IdTypeStockage  };

          var id = db.GetCollection<Logistique>().Insert(logistique).AsInt32;

          return Results.Created("", id);
     }

     async static Task<IResult> ModifierAsync(
          [FromRoute(Name = "idLogistique")] int _idLogistique,
          [FromBody] LogistiqueRequete _requete
     )
     {
          if (_idLogistique <= 0)
               return Results.NotFound("L'objet n'existe pas");

          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_requete.Prix <= 0)
               return Results.BadRequest("Le prix doit être supérieur à zéro");

          if (_requete.NbDetruit < 0)
               return Results.BadRequest("Détruit ne peut pas être négatif");

          if (_requete.Stock < 0)
               return Results.BadRequest("Le stock ne peut pas être négatif");

          if (_requete.TailleUnitaireInventaire < 0)
               return Results.BadRequest("La taille d'inventaire ne peut pas être négatif");

          if (_requete.IdType <= 0)
               return Results.BadRequest("Le type n'existe pas");

          if (_requete.IdTypeStockage <= 0)
               return Results.BadRequest("Le type de stockage n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var logistique = new Logistique
          {
               Id = _idLogistique,
               Nom = _requete.Nom.XSS(),
               Prix = _requete.Prix,
               IgnoreTypeStockage = _requete.IgnoreTypeStockage,
               EstKit = _requete.EstKit,
               NbDetruit = _requete.NbDetruit,
               Stock = _requete.Stock,
               TailleUnitaireInventaire = _requete.TailleUnitaireInventaire
          };

          if (!db.GetCollection<LogistiqueType>().Exists(x => x.Id == _requete.IdType))
               return Results.NotFound("Le type n'existe pas");

          if (!db.GetCollection<TypeStockageLogistique>().Exists(x => x.Id == _requete.IdTypeStockage))
               return Results.NotFound("Le type de stockage n'existe pas");

          logistique.LogistiqueType = new LogistiqueType { Id = _requete.IdType };
          logistique.TypeStockage = new TypeStockageLogistique { Id = _requete.IdTypeStockage };

          var ok = db.GetCollection<Logistique>().Update(logistique);

          return ok ? Results.NoContent() : Results.NotFound("L'objet n'existe pas");
     }

     async static Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idLogistique")] int _idLogistique
     )
     {
          if (_idLogistique <= 0)
               return Results.NotFound("l'objet n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var ok = db.GetCollection<Logistique>().Delete(_idLogistique);

          return ok ? Results.NoContent() : Results.NotFound("l'objet n'existe pas");
     }
}
