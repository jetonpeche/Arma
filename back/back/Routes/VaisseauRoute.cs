using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class VaisseauRoute
{
     public static RouteGroupBuilder AjouterRouteVaisseau(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
              .WithDescription("Lister les vaisseaux")
              .Produces<VaisseauReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouveau vaisseau")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPost("acheter", AcheterAsync)
               .WithDescription("Acheter un vaisseau")
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapPut("modifier/{idVaisseau:int}", ModifierAsync)
               .WithDescription("Modifier un vaisseau")
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idVaisseau:int}", SupprimerAsync)
               .WithDescription("Supprimer un vaisseau")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     static async Task<IResult> ListerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Vaisseau>()
               .Query()
               .Include(x => x.ListeStockage)
               .Include(x => x.ListeStockage.Select(y => y.TypeStockage))
               .ToList()
               .Select(x => new VaisseauReponse
               {
                     Id = x.Id,
                     Nom = x.Nom,
                     Prix = x.Prix,
                     Role = x.Role,
                     Stock = x.Stock,
                     CapaciteSpeciale = x.CapaciteSpeciale,
                     Blindage = x.Blindage,
                     Vitesse = x.Vitesse,

                     Equipage = new ()
                     {
                          NbPlaceMarines = x.Equipage.NbPlaceMarines,
                          NbPlacePassager = x.Equipage.NbPlacePassager
                     },
                     ListeArmement = x.ListeArmement.Select(y => new ArmementVaisseauReponse
                     {
                          Id = y.Id,
                          Nom = y.Nom,
                          Information = y.Information,
                          Nombre = y.Nombre,
                          MunitionInfini = y.MunitionInfini,
                          Munition = y.Munition,
                          NbTourReload = y.NbTourReload,
                          EstUsageUnique = y.EstUsageUnique
                     }).ToArray(),

                     ListeStockage = x.ListeStockage.Select(y => new StockageVaisseauReponse
                     {
                          Id = y.Id,
                          Nom = y.Nom,
                          Taille = y.Taille,
                          TypeStockage = new ()
                          { 
                               Id = y.TypeStockage.Id,
                               Nom = y.TypeStockage.Nom
                          }
                     }).ToArray()
               })
               .ToArray();

          return Results.Extensions.Ok(liste, VaisseauReponseContext.Default);
     }

     static async Task<IResult> AjouterAsync(
          [FromBody] VaisseauRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if(string.IsNullOrWhiteSpace(_requete.Blindage))
               return Results.BadRequest("Le blindage ne peut pas être vide");

          if (string.IsNullOrWhiteSpace(_requete.Vitesse))
               return Results.BadRequest("La vitesse ne peut pas être vide");

          if (string.IsNullOrWhiteSpace(_requete.Role))
               return Results.BadRequest("Le rôle ne peut pas être vide");

          if (_requete.Prix <= 0)
               return Results.BadRequest("Le prix doit être supérieur à zéro");

          if (_requete.Stock < 0)
               return Results.BadRequest("Le prix ne peut pas être inférieur à zéro");

          if (_requete.Equipage.NbPlaceMarines < 0)
               return Results.BadRequest("Le nombre de marines ne peut pas être inférieur à zéro");

          if (_requete.Equipage.NbPlacePassager < 0)
               return Results.BadRequest("Le nombre de passager ne peut pas être inférieur à zéro");

          for (int i = 0; i < _requete.ListeArmement.Length; i++)
          {
               var element = _requete.ListeArmement[i];

               if (string.IsNullOrWhiteSpace(element.Nom))
                    return Results.BadRequest($"Le nom du stockage n°{i + 1} ne peut pas être vide");

               if (element.NbTourReload <= 0)
                    return Results.BadRequest($"Le nombre de tour(s) de {element.Nom} ne peut pas être inférieur à zéro");

               if (element.Nombre <= 0)
                    return Results.BadRequest($"Le nombre de {element.Nom} ne peut pas être inférieur à zéro");

               if (element.Munition <= 0)
                    return Results.BadRequest($"Le nombre de munitions de {element.Nom} ne peut pas être inférieur à zéro");
          }

          using var db = new LiteDatabase(Constant.BDD_NOM);

          for (int i = 0; i < _requete.ListeStockage.Length; i++)
          {
               var element = _requete.ListeStockage[i];

               if (string.IsNullOrWhiteSpace(element.Nom))
                    return Results.BadRequest($"Le nom du stockage n°{i + 1} ne peut pas être vide");

               if (element.Taille <= 0)
                    return Results.BadRequest($"Le stockage {element.Nom} doit être supérieur à zéro");

               if (element.IdTypeStockage <= 0 || !db.GetCollection<TypeStockageLogistique>().Exists(x => x.Id == element.IdTypeStockage))
                    return Results.NotFound($"Le type de stockage de {element.Nom} n'existe pas");
          }

          var vaisseau = new Vaisseau
          {
               Nom = _requete.Nom.XSS(),
               Blindage = _requete.Blindage.XSS(),
               Vitesse = _requete.Vitesse.XSS(),
               Role = _requete.Role.XSS(),
               CapaciteSpeciale = string.IsNullOrWhiteSpace(_requete.CapaciteSpeciale) ? null : _requete.CapaciteSpeciale.XSS(),
               Prix = _requete.Prix,
               Stock = _requete.Stock,
               Equipage = new()
               {
                    NbPlaceMarines = _requete.Equipage.NbPlaceMarines,
                    NbPlacePassager = _requete.Equipage.NbPlacePassager
               }
          };

          for (int i = 0; i < _requete.ListeArmement.Length; i++)
          {
               var element = _requete.ListeArmement[i];

               vaisseau.ListeArmement.Add(new()
               {
                    Id = Guid.NewGuid(),
                    Nom = element.Nom.XSS(),
                    Information = string.IsNullOrWhiteSpace(element.Information) ? null : element.Information.XSS(),
                    Nombre = element.Nombre,
                    Munition = element.MunitionInfini ? 0 : element.Munition,
                    MunitionInfini = element.MunitionInfini,
                    NbTourReload = element.NbTourReload,
                    EstUsageUnique = element.EstUsageUnique
               });
          }

          int idVaisseau = db.GetCollection<Vaisseau>().Insert(vaisseau);

          for (int i = 0; i < _requete.ListeStockage.Length; i++)
          {
               var element = _requete.ListeStockage[i];

               var stockage = new StockageVaisseau
               {
                    Nom = element.Nom.XSS(),
                    Taille = element.Taille,
                    Vaisseau = new() { Id = idVaisseau },
                    TypeStockage = new() { Id = element.IdTypeStockage }
               };

               db.GetCollection<StockageVaisseau>().Insert(stockage);

              vaisseau.ListeStockage.Add(stockage);
          }

          db.GetCollection<Vaisseau>().Update(vaisseau);

          return Results.Created("", null);
     }

     static async Task<IResult> AcheterAsync(
          [FromBody] VaisseauAcheterRequete _requete
     )
     {
          if (_requete.IdVaisseau <= 0)
               return Results.NotFound("Le vaisseau n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var banque = db.GetCollection<Banque>().Query().First();

          int prixVaisseau = db.GetCollection<Vaisseau>().Query()
               .Where(x => x.Id == _requete.IdVaisseau)
               .Select(x => x.Prix)
               .FirstOrDefault();

          if(prixVaisseau is 0)
               return Results.NotFound("Le vaisseau n'existe pas");

          if (prixVaisseau > banque.Argent)
               return Results.BadRequest("Vous n'avez pas assez d'argent");

          banque.Argent -= prixVaisseau;
          db.GetCollection<Banque>().Update(banque);

          db.Execute(
               $"UPDATE {nameof(Vaisseau)} SET Stock = Stock + 1 WHERE _id = @0",
               [_requete.IdVaisseau]
          );

          db.GetCollection<VaisseauPosseder>().Insert(new VaisseauPosseder
          {
               Vaisseau = new Vaisseau { Id = _requete.IdVaisseau },
               NomVaisseau = string.IsNullOrWhiteSpace(_requete.NomVaisseau) ? null : _requete.NomVaisseau,
               NomCommandant = string.IsNullOrWhiteSpace(_requete.NomCommandant) ? null : _requete.NomCommandant,
               Information = string.IsNullOrWhiteSpace(_requete.Information) ? null : _requete.Information
          });

          return Results.NoContent();
     }

     static async Task<IResult> ModifierAsync(
          [FromRoute(Name = "idVaisseau")] int _idVaisseau,
          [FromBody] VaisseauModifierRequete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          if (_idVaisseau <= 0)
               return Results.NotFound("Le vaisseau n'existe pas");

          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          if (string.IsNullOrWhiteSpace(_requete.Blindage))
               return Results.BadRequest("Le blindage ne peut pas être vide");

          if (string.IsNullOrWhiteSpace(_requete.Vitesse))
               return Results.BadRequest("La vitesse ne peut pas être vide");

          if (string.IsNullOrWhiteSpace(_requete.Role))
               return Results.BadRequest("Le rôle ne peut pas être vide");

          if (_requete.Prix <= 0)
               return Results.BadRequest("Le prix doit être supérieur à zéro");

          if (_requete.Stock < 0)
               return Results.BadRequest("Le prix ne peut pas être inférieur à zéro");

          if (_requete.Equipage.NbPlaceMarines < 0)
               return Results.BadRequest("Le nombre de marines ne peut pas être inférieur à zéro");

          if (_requete.Equipage.NbPlacePassager < 0)
               return Results.BadRequest("Le nombre de passager ne peut pas être inférieur à zéro");

          for (int i = 0; i < _requete.ListeArmement.Length; i++)
          {
               var element = _requete.ListeArmement[i];

               if (string.IsNullOrWhiteSpace(element.Nom))
                    return Results.BadRequest($"Le nom du stockage n°{i + 1} ne peut pas être vide");

               if (element.NbTourReload <= 0)
                    return Results.BadRequest($"Le nombre de tour(s) de {element.Nom} ne peut pas être inférieur à zéro");

               if (element.Nombre <= 0)
                    return Results.BadRequest($"Le nombre de {element.Nom} ne peut pas être inférieur à zéro");

               if (element.Munition <= 0)
                    return Results.BadRequest($"Le nombre de munitions de {element.Nom} ne peut pas être inférieur à zéro");
          }

          for (int i = 0; i < _requete.ListeStockage.Length; i++)
          {
               var element = _requete.ListeStockage[i];

               if (string.IsNullOrWhiteSpace(element.Nom))
                    return Results.BadRequest($"Le nom du stockage n°{i + 1} ne peut pas être vide");

               if (element.Id.HasValue)
               {
                    if (element.Id.Value <= 0 || !db.GetCollection<StockageVaisseau>().Exists(x => x.Id == element.Id.Value))
                         return Results.NotFound($"Le stockage n°{element.Nom.XSS()} n'existe pas");
               }

               if (element.Taille <= 0)
                    return Results.BadRequest($"Le stockage {element.Nom.XSS()} doit être supérieur à zéro");

               if (element.IdTypeStockage <= 0 || !db.GetCollection<TypeStockageLogistique>().Exists(x => x.Id == element.IdTypeStockage))
                    return Results.NotFound($"Le type de stockage de {element.Nom.XSS()} n'existe pas");
          }

          var vaisseau = db.GetCollection<Vaisseau>()
               .Include(x => x.ListeStockage)
               .FindById(_idVaisseau);

          vaisseau.Nom = _requete.Nom.XSS();
          vaisseau.Role = _requete.Role.XSS();
          vaisseau.Blindage = _requete.Blindage.XSS();
          vaisseau.Vitesse = _requete.Vitesse.XSS();
          vaisseau.Prix = _requete.Prix;
          vaisseau.Stock = _requete.Stock;
          vaisseau.CapaciteSpeciale = string.IsNullOrWhiteSpace(_requete.CapaciteSpeciale) ? null : _requete.CapaciteSpeciale.XSS();
          vaisseau.Equipage.NbPlaceMarines = _requete.Equipage.NbPlaceMarines;
          vaisseau.Equipage.NbPlacePassager = _requete.Equipage.NbPlacePassager;

          var dictArmement = vaisseau.ListeArmement
              .ToDictionary(x => x.Id);

          vaisseau.ListeArmement = _requete.ListeArmement.Select(x =>
          {
               if(dictArmement.TryGetValue(x.Id, out var armementRef))
               {
                    return new ArmementVaisseau
                    {
                         Id = armementRef.Id,
                         Nombre = x.Nombre,
                         Nom = x.Nom.XSS(),
                         NbTourReload = x.NbTourReload,
                         Information = string.IsNullOrWhiteSpace(x.Information) ? null : x.Information.XSS(),
                         MunitionInfini = x.MunitionInfini,
                         Munition = x.MunitionInfini ? 0 : x.Munition
                    };
               }

               return new ArmementVaisseau
               {
                    Id = Guid.NewGuid(),
                    Nombre = x.Nombre,
                    Nom = x.Nom.XSS(),
                    NbTourReload = x.NbTourReload,
                    Information = string.IsNullOrWhiteSpace(x.Information) ? null : x.Information.XSS(),
                    MunitionInfini = x.MunitionInfini,
                    Munition = x.MunitionInfini ? 0 : x.Munition
               };
          }).ToList();

          // supprime les stockages existants qui ne sont pas dans la requete
          if (_requete.ListeStockage.Count(x => x.Id.HasValue) < vaisseau.ListeStockage.Count)
          {
               var stockageSupprimer = vaisseau.ListeStockage
                    .Where(x => !_requete.ListeStockage.Any(y => y.Id.HasValue && y.Id.Value == x.Id))
                    .Select(x => x.Id)
                    .ToArray();

               for (int i = 0; i < stockageSupprimer.Length; i++)
                    db.GetCollection<StockageVaisseau>().Delete(stockageSupprimer[i]);
          }

          var dictStockage = vaisseau.ListeStockage
              .ToDictionary(x => x.Id);

          vaisseau.ListeStockage = _requete.ListeStockage.Select(x =>
          {
               if(x.Id.HasValue && dictStockage.TryGetValue(x.Id.Value, out var stockage))
               {
                    stockage.Nom = x.Nom.XSS();
                    stockage.Taille = x.Taille;
                    stockage.TypeStockage = new TypeStockageLogistique { Id = x.IdTypeStockage };
                    
                    db.GetCollection<StockageVaisseau>().Insert(stockage);

                    return stockage;
               }

               var nouveauStockage = new StockageVaisseau
               {
                    Nom = x.Nom.XSS(),
                    Taille = x.Taille,
                    TypeStockage = new TypeStockageLogistique { Id = x.IdTypeStockage },
                    Vaisseau = new Vaisseau { Id = _idVaisseau }
               };

               db.GetCollection<StockageVaisseau>().Insert(nouveauStockage);

               return nouveauStockage;

          }).ToList();

          var ok = db.GetCollection<Vaisseau>().Update(vaisseau);

          return ok ? Results.NoContent() : Results.NotFound("Le vaisseau n'existe pas");
     }

     static async Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idVaisseau")] int _idVaisseau
     )
     {
          if (_idVaisseau <= 0)
               return Results.NotFound("Le vaisseau n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var ok = db.GetCollection<Vaisseau>().Delete(_idVaisseau);

          if(ok)
               db.GetCollection<StockageVaisseau>().DeleteMany(x => x.Vaisseau.Id == _idVaisseau);

          return ok ? Results.NoContent() : Results.NotFound("Le vaisseau n'existe pas");
     }
}
