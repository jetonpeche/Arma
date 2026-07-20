using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace back.Routes;

public static class LogistiqueRoute
{
    const string NOM_CACHE = "logistique";
    
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

    async static Task<IResult> ListerAsync(
          [FromServices] IMemoryCache _cache
    )
    {
          var liste = await _cache.GetOrCreateAsync(NOM_CACHE, async cache =>
          {
               using var db = new LiteDatabase(Constant.BDD_NOM);

               var liste = db.GetCollection<Logistique>()
                    .Query()
                    .Include(x => x.LogistiqueType)
                    .Include(x => x.TypeStockage)
                    .Include(x => x.ListeStockageVaisseauPosseder)
                    .Include(x => x.ListeStockageVaisseauPosseder.Select(y => y.VaisseauPosseder))
                    .Include(x => x.ListeStockageVaisseauPosseder.Select(y => y.Stockage))
                    .OrderBy(x => x.Prix)
                    .ToEnumerable()
                    .Select(x => new LogistiqueReponse
                    {
                         Id = x.Id,
                         Nom = x.Nom,
                         Description = x.Description,
                         Prix = x.Prix,
                         NbDetruit = x.NbDetruit,
                         EstKit = x.EstKit,
                         IgnoreTypeStockage = x.IgnoreTypeStockage,
                         ListeStockageVaisseau = [.. x.ListeStockageVaisseauPosseder.Select(y => new LogistiqueStockReponse
                         {
                              NomVaisseau = y.VaisseauPosseder.NomVaisseau ?? "SANS NOM",
                              NomStockage = y.Stockage.Nom,
                              Quantite = y.Quantite
                         })],
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

               if (liste.Length > 0)
               {
                    cache.SlidingExpiration = TimeSpan.FromMinutes(5);
                    cache.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(20);
              }

              return liste;
          });

          return Results.Extensions.Ok(liste, LogistiqueReponseContext.Default);
     }

    async static Task<IResult> AjouterAsync(
          [FromServices] IMemoryCache _cache,
         [FromBody] LogistiqueRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (_requete.Prix <= 0)
               return Results.BadRequest("Le prix doit être supérieur à zéro");

          if (_requete.NbDetruit < 0)
               return Results.BadRequest("Détruit ne peut pas être négatif");

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
               Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
               Prix = _requete.Prix,
               IgnoreTypeStockage = _requete.IgnoreTypeStockage,
               EstKit = _requete.EstKit,
               NbDetruit = _requete.NbDetruit,
               TailleUnitaireInventaire = _requete.TailleUnitaireInventaire
          };

          if (!db.GetCollection<LogistiqueType>().Exists(x => x.Id == _requete.IdType))
               return Results.NotFound("Le type n'existe pas");

          if (!db.GetCollection<TypeStockageLogistique>().Exists(x => x.Id == _requete.IdTypeStockage))
               return Results.NotFound("Le type de stockage n'existe pas");

          logistique.LogistiqueType = new LogistiqueType { Id = _requete.IdType };
          logistique.TypeStockage = new TypeStockageLogistique { Id = _requete.IdTypeStockage  };

          var id = db.GetCollection<Logistique>().Insert(logistique).AsInt32;

          _cache.Remove(NOM_CACHE);
          
        return Results.Created("", id);
     }

    async static Task<IResult> ModifierAsync(
          [FromServices] IMemoryCache _cache,
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
               Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
               Prix = _requete.Prix,
               IgnoreTypeStockage = _requete.IgnoreTypeStockage,
               EstKit = _requete.EstKit,
               NbDetruit = _requete.NbDetruit,
               TailleUnitaireInventaire = _requete.TailleUnitaireInventaire
          };

          if (!db.GetCollection<LogistiqueType>().Exists(x => x.Id == _requete.IdType))
               return Results.NotFound("Le type n'existe pas");

          if (!db.GetCollection<TypeStockageLogistique>().Exists(x => x.Id == _requete.IdTypeStockage))
               return Results.NotFound("Le type de stockage n'existe pas");

          logistique.LogistiqueType = new LogistiqueType { Id = _requete.IdType };
          logistique.TypeStockage = new TypeStockageLogistique { Id = _requete.IdTypeStockage };

          var ok = db.GetCollection<Logistique>().Update(logistique);

          if (ok)
          {
               _cache.Remove(NOM_CACHE);
               return Results.NoContent();
          }

          return Results.NotFound("L'objet n'existe pas");
    }

    async static Task<IResult> SupprimerAsync(
          [FromServices] IMemoryCache _cache,
         [FromRoute(Name = "idLogistique")] int _idLogistique
     )
     {
          if (_idLogistique <= 0)
               return Results.NotFound("l'objet n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var ok = false;   
          if (db.GetCollection<StockageVaisseauPosseder>().Query().Where(x => x.Logistique.Id == _idLogistique).Count() > 0)
               ok = db.GetCollection<Logistique>().UpdateMany(_ => new Logistique { EstSupprimer = true }, x => x.Id == _idLogistique) > 0;

          else
               ok = db.GetCollection<Logistique>().Delete(_idLogistique);

          if (ok)
          {
               _cache.Remove(NOM_CACHE);
               return Results.NoContent();
          }
        
          return Results.NotFound("l'objet n'existe pas");
     }
}
