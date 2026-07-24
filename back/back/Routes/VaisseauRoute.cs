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
          builder.MapGet("lister", (Delegate)ListerAsync)
               .WithDescription("Lister les vaisseaux")
               .Produces<VaisseauReponse[]>();

          builder.MapGet("lister-leger", ListerLegerAsync)
               .WithDescription("Lister les vaisseaux aleger")
               .Produces<VaisseauLegerReponse[]>();

          builder.MapGet("lister-posseder", ListerPossederAsync)
               .ProducesNotFound()
               .Produces<VaisseauPossederReponse[]>();

          builder.MapGet("lister-stockage-compatible/{idTypeStockage:int}", ListerStockageCompatibleAsync)
               .ProducesNotFound()
               .Produces<StockageCompatibleVaisseauPossederReponse[]>();

          builder.MapGet("{idVaisseauPosseder}/lister-contenu-stockage/{idStockage}", ListerContenuStockageAsync)
               .ProducesNotFound()
               .Produces<ContenuStockagePossederReponse[]>();

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

     static async Task<IResult> ListerAsync(HttpContext _httpContext)
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Vaisseau>()
               .Query()
               .Include(x => x.ListeStockage)
               .Include(x => x.ListeVaisseauEnPlus)
               .Include(x => x.ListeStockage.Select(y => y.TypeStockage))
               .Include(x => x.ListeStockage.Select(y => y.ListeContenuDefaut))
               .Include(x => x.ListeStockage.Select(y => y.ListeContenuDefaut.Select(z => z.Logistique)))
               .Where(x => !x.EstSupprimer)
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
                    BloquerAchat = x.BloquerAchat,
                    NomFichier = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_VAISSEAU + x.NomFichier : "",

                    Equipage = new ()
                    {
                         NbPlaceMarines = x.Equipage.NbPlaceMarines,
                         NbPlacePassager = x.Equipage.NbPlacePassager
                    },

                    ListeVaisseauEnfant = [.. x.ListeVaisseauEnPlus.Select(y => new VaisseauLegerReponse
                    { 
                         Id = y.Id,
                         Nom = y.Nom
                    })],

                    ListeArmement = [.. x.ListeArmement.Select(y => new ArmementVaisseauReponse
                    {
                         Id = y.Id,
                         Nom = y.Nom,
                         Information = y.Information,
                         Nombre = y.Nombre,
                         MunitionInfini = y.MunitionInfini,
                         NbTourReload = y.NbTourReload,
                         EstUsageUnique = y.EstUsageUnique,
                         NbNombreReloadParNbTour = y.NbNombreReloadParNbTour
                    })],

                    ListeStockage = [.. x.ListeStockage.Select(y => new StockageVaisseauReponse
                    {
                         Id = y.Id,
                         Nom = y.Nom,
                         Taille = y.Taille,
                         TypeStockage = new ()
                         { 
                              Id = y.TypeStockage.Id,
                              Nom = y.TypeStockage.Nom
                         },

                         ListeContenuDefaut = [.. y.ListeContenuDefaut.Select(z => new StockageVaisseauContenuDefautReponse
                         {
                              IdLogistique = z.Logistique.Id,
                              Nom = z.Logistique.Nom,
                              Quantite = z.Quantite
                         })]
                    })]
               })
               .ToArray();

          return Results.Extensions.Ok(liste, VaisseauReponseContext.Default);
     }

     static async Task<IResult> ListerLegerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Vaisseau>()
               .Query()
               .Where(x => !x.EstSupprimer)
               .OrderBy(x => x.Nom)
               .Select(x => new VaisseauLegerReponse
               {
                    Id = x.Id,
                    Nom = x.Nom
               }).ToArray();

          return Results.Extensions.Ok(liste, VaisseauLegerReponseContext.Default);
     }

    static async Task<IResult> ListerPossederAsync()
    {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var listeBrute = db.GetCollection<VaisseauPosseder>()
               .Include(v => v.Vaisseau)
               .Include(v => v.Vaisseau.ListeStockage)
               .Include(v => v.Vaisseau.ListeStockage.Select(y => y.TypeStockage))
               .Include(x => x.ListeStockage)
               .Include(x => x.ListeStockage.Select(y => y.Stockage))
               .Query()
               .ToList()
               .ConvertAll(x => new VaisseauPossederReponse
               {
                    Id = x.Id,
                    Information = x.Information,
                    NomVaisseauAlias = x.NomVaisseau,
                    NomVaisseau = x.Vaisseau.Nom,
                    NomCommandant = x.NomCommandant,
                    ListeArmement = [.. x.Vaisseau.ListeArmement.Select(y =>
                    {
                         var armement = x.ListeCapaciteArmement.FirstOrDefault(z => z.IdArmement == y.Id);
                         return new ArmementVaisseauPossederReponse
                         {
                              Id = y.Id,
                              Nom = y.Nom,
                              Information = y.Information,
                              NombreMax = y.Nombre,
                              NombreDisponible = armement?.NombreDisponible ?? y.Nombre,
                              EstUsageUnique = y.EstUsageUnique,
                              MunitionInfini = y.MunitionInfini,
                              NbTourReload = y.NbTourReload,
                              NbNombreReloadParNbTour = y.NbNombreReloadParNbTour
                         };
                   })],
                   ListeStockage = [.. x.Vaisseau.ListeStockage.Select(y => new StockageVaisseauPossederReponse
                    {
                         Id = y.Id,
                         IdTypeStockage = y.TypeStockage.Id,
                         NomTypeStockage = y.TypeStockage.Nom,
                         Nom = y.Nom,
                         Taille = y.Taille,
                         Occuper = x.ListeStockage?
                              .Where(z => x.ListeStockage != null && z.Stockage.Id == y.Id)
                              .Sum(z => z.Quantite) ?? 0
                    })]
               });

        return Results.Extensions.Ok(listeBrute, VaisseauPossederReponseContext.Default);
     }

    static async Task<IResult> ListerContenuStockageAsync(
          [FromRoute(Name = "idVaisseauPosseder")] int _idVaisseauPosseder, 
          [FromRoute(Name = "idStockage")] int _idStockage 
    )
    {
          if (_idVaisseauPosseder <= 0 || _idStockage <= 0)
               return Results.NotFound();

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<StockageVaisseauPosseder>().Query()
               .Include(x => x.Logistique)
               .Where(x => x.VaisseauPosseder.Id == _idVaisseauPosseder && x.Stockage.Id == _idStockage)
               .Select(x => new ContenuStockagePossederReponse
               {
                    Id = x.Id,
                    Nom = x.Logistique.Nom,
                    Quantite = x.Quantite
               }).ToArray();

          return Results.Extensions.Ok(liste, ContenuStockagePossederReponseContext.Default);
    }

    static async Task<IResult> ListerStockageCompatibleAsync(
          [FromRoute(Name = "idTypeStockage")] int _idTypeStockage
    )
    {
          if(_idTypeStockage <= 0)
               return Results.NotFound();

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<VaisseauPosseder>()
               .Include(v => v.Vaisseau)
               .Include(v => v.Vaisseau.ListeStockage)
               .Include(x => x.ListeStockage)
               .Query()
               .ToList()
               .ConvertAll(x => new StockageCompatibleVaisseauPossederReponse
               {
                    Id = x.Id,
                    NomVaisseauAlias = x.NomVaisseau,
                    NomVaisseau = x.Vaisseau.Nom,
                    ListeStockage = [..x.Vaisseau.ListeStockage.Where(y => y.TypeStockage.Id == _idTypeStockage).Select(y => new StockageVaisseauPossederReponse
                    {
                         Id = y.Id,
                         IdTypeStockage = y.TypeStockage.Id,
                         NomTypeStockage = "",
                         Nom = y.Nom,
                         Taille = y.Taille,
                         Occuper = x.ListeStockage
                              .Where(z => x.ListeStockage != null && z.Stockage.Id == y.Id)
                              .Sum(z => z.Quantite)
                    })]
               });

        return Results.Extensions.Ok(liste, StockageCompatibleVaisseauPossederReponseContext.Default);
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

          if (_requete.Equipage.NbPlaceMarines < 0)
               return Results.BadRequest("Le nombre de marines ne peut pas être inférieur à zéro");

          if (_requete.Equipage.NbPlacePassager < 0)
               return Results.BadRequest("Le nombre de passager ne peut pas être inférieur à zéro");

          for (int i = 0; i < _requete.ListeArmement.Length; i++)
          {
               var element = _requete.ListeArmement[i];

               if (string.IsNullOrWhiteSpace(element.Nom))
                    return Results.BadRequest($"Le nom du stockage n°{i + 1} ne peut pas être vide");

               if (!element.EstUsageUnique && element.NbTourReload <= 0)
                    return Results.BadRequest($"Le nombre de tour(s) de {element.Nom} ne peut pas être inférieur à zéro");

               if (element.Nombre <= 0)
                    return Results.BadRequest($"Le nombre de {element.Nom} ne peut pas être inférieur à zéro");

               if (element.NbNombreReloadParNbTour < 0)
                    return Results.BadRequest("Le nombre de munition recharger ne peut pas être inférieur à zéro");
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

               if (element.ListeContenuDefaut.Length > 0)
               {
                    if (element.ListeContenuDefaut.Any(x => x.Quantite <= 0))
                         return Results.BadRequest("Une des quantités de contenu par défaut doit être supérieur à zéro");
                    
                    var listeIdLogistiqueBson = element.ListeContenuDefaut.Select(x => new BsonValue(x.IdLogistique));
                    var nb = db.GetCollection<Logistique>().Query().Where(Query.In("_id", listeIdLogistiqueBson)).Count();

                    if (nb != element.ListeContenuDefaut.Length)
                         return Results.BadRequest($"Un idLogistique n'existe pas dans {element.Nom}");
               }
        }

          for (int i = 0; i < _requete.ListeIdVaisseauEnfant.Length; i++)
          {
               var element = _requete.ListeIdVaisseauEnfant[i];

               if (element <= 0)
                    return Results.BadRequest($"Le vaisseau n°{i} existe pas");
          }

          var vaisseau = new Vaisseau
          {
               Nom = _requete.Nom.XSS(),
               Blindage = _requete.Blindage.XSS(),
               Vitesse = _requete.Vitesse.XSS(),
               Role = _requete.Role.XSS(),
               CapaciteSpeciale = string.IsNullOrWhiteSpace(_requete.CapaciteSpeciale) ? null : _requete.CapaciteSpeciale.XSS(),
               Prix = _requete.Prix,
               Stock = 0,
               BloquerAchat = _requete.BloquerAchat,
               Equipage = new()
               {
                    NbPlaceMarines = _requete.Equipage.NbPlaceMarines,
                    NbPlacePassager = _requete.Equipage.NbPlacePassager
               }
          };

          if (_requete.ListeIdVaisseauEnfant.Length > 0)
          {
               var listeIdVaisseauBson = _requete.ListeIdVaisseauEnfant.Select(x => new BsonValue(x)).ToArray();
               var listeIdVaisseau = db.GetCollection<Vaisseau>().Query()
                    .Where(Query.In("_id", listeIdVaisseauBson))
                    .Select(x => x.Id)
                    .ToArray();

               if (listeIdVaisseau.Length != _requete.ListeIdVaisseauEnfant.Length)
                    return Results.BadRequest("Un ou plusieurs vaisseau(x) n'existe pas");

               vaisseau.ListeVaisseauEnPlus = [.. _requete.ListeIdVaisseauEnfant.Select(x => new Vaisseau { Id = x })];
          }
          else
               vaisseau.ListeVaisseauEnPlus = [];

          for (int i = 0; i < _requete.ListeArmement.Length; i++)
          {
               var element = _requete.ListeArmement[i];

               vaisseau.ListeArmement.Add(new()
               {
                    Id = Guid.NewGuid(),
                    Nom = element.Nom.XSS(),
                    Information = string.IsNullOrWhiteSpace(element.Information) ? null : element.Information.XSS(),
                    Nombre = element.Nombre,
                    MunitionInfini = element.MunitionInfini,
                    NbTourReload = element.NbTourReload,
                   EstUsageUnique = element.EstUsageUnique,
                   NbNombreReloadParNbTour = element.NbNombreReloadParNbTour
               });
          }

          int idVaisseau = db.GetCollection<Vaisseau>().Insert(vaisseau);

          for (int i = 0; i < _requete.ListeStockage.Length; i++)
          {
               var element = _requete.ListeStockage[i];

               var listeContenuDefaut = element.ListeContenuDefaut.Select(x => new VaisseauStockageContenuDefaut
               {
                    Logistique = new() { Id = x.IdLogistique },
                    Quantite = x.Quantite
               }).ToList();

               db.GetCollection<VaisseauStockageContenuDefaut>().Insert(listeContenuDefaut);

               var stockage = new StockageVaisseau
               {
                    Nom = element.Nom.XSS(),
                    Taille = element.Taille,
                    Vaisseau = new() { Id = idVaisseau },
                   TypeStockage = new() { Id = element.IdTypeStockage },
                   ListeContenuDefaut = listeContenuDefaut
               };

               db.GetCollection<StockageVaisseau>().Insert(stockage);

              vaisseau.ListeStockage.Add(stockage);
          }

          db.GetCollection<Vaisseau>().Update(vaisseau);

          return Results.Created("", null);
     }

     static async Task<IResult> AcheterAsync(
          HttpContext _httpContext,
          [FromBody] VaisseauAcheterRequete _requete
     )
     {
          if (_requete.IdVaisseau <= 0)
               return Results.NotFound("Le vaisseau n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var banque = db.GetCollection<Banque>().Query().First();

          var vaisseauDb = db.GetCollection<Vaisseau>()
               .Include(x => x.ListeVaisseauEnPlus)
               .Include("$.ListeVaisseauEnPlus[*].ListeVaisseauEnPlus")
               .FindById(_requete.IdVaisseau);

          if (vaisseauDb is null)
               return Results.NotFound("Vaisseau introuvable");

          var listeIdEnfant = vaisseauDb.ListeVaisseauEnPlus.Select(e => e.Id);

          var listeIdPetitsEnfant = vaisseauDb.ListeVaisseauEnPlus
               .Where(x => x.ListeVaisseauEnPlus != null)
               .SelectMany(x => x.ListeVaisseauEnPlus.Select(y => y.Id));

          var info = new
          {
               vaisseauDb.Nom,
               vaisseauDb.Prix,
               vaisseauDb.BloquerAchat,
               ListeVaisseauEnPlus = listeIdEnfant.Concat(listeIdPetitsEnfant).ToArray()
          };

          if (info.BloquerAchat)
               return Results.BadRequest("L'achat de ce vaisseau est bloqué");

          if(info.Prix is 0)
               return Results.NotFound("Le vaisseau n'existe pas");

          if (info.Prix > banque.Argent)
               return Results.BadRequest("Vous n'avez pas assez d'argent");

          banque.Argent -= info.Prix;
          db.GetCollection<Banque>().Update(banque);

          List<VaisseauPosseder> listeVaisseau = [];
          if (info.ListeVaisseauEnPlus.Length > 0)
          {
               var listeIdVaisseauBson = new BsonArray(info.ListeVaisseauEnPlus.Select(id => new BsonValue(id)))
               {
                    new(_requete.IdVaisseau)
               };

               foreach (var element in listeIdVaisseauBson)
                    db.Execute($"UPDATE {nameof(Vaisseau)} SET Stock = Stock + 1 WHERE _id = {element}");

               listeVaisseau.AddRange(listeIdVaisseauBson.Select(x => new VaisseauPosseder
               {
                    Vaisseau = new Vaisseau { Id = x.AsInt32 },
                    NomVaisseau = string.IsNullOrWhiteSpace(_requete.NomVaisseau) ? null : _requete.NomVaisseau,
                    NomCommandant = string.IsNullOrWhiteSpace(_requete.NomCommandant) ? null : _requete.NomCommandant,
                   Information = string.IsNullOrWhiteSpace(_requete.Information) ? null : _requete.Information
               }));
          }
          else
          {
               db.Execute(
                    $"UPDATE {nameof(Vaisseau)} SET Stock = Stock + 1 WHERE _id = @0",
                    [_requete.IdVaisseau]
               );

               listeVaisseau.Add(new VaisseauPosseder
               {
                    Vaisseau = new Vaisseau { Id = _requete.IdVaisseau },
                    NomVaisseau = string.IsNullOrWhiteSpace(_requete.NomVaisseau) ? null : _requete.NomVaisseau,
                    NomCommandant = string.IsNullOrWhiteSpace(_requete.NomCommandant) ? null : _requete.NomCommandant,
                    Information = string.IsNullOrWhiteSpace(_requete.Information) ? null : _requete.Information
               });
          }

          db.GetCollection<VaisseauPosseder>().Insert(listeVaisseau);

          // ajout des stockage par defaut dans chaque vaisseau
          var listeIdVaisseauAcheterBson = listeVaisseau.Select(x => new BsonValue(x.Vaisseau.Id)).ToArray();
          var listeVaisseauDb = db.GetCollection<Vaisseau>()
               .Include(x => x.ListeStockage)
               .Include(x => x.ListeStockage.Select(y => y.ListeContenuDefaut))
               .Find(Query.In("_id", listeIdVaisseauAcheterBson))
               .ToArray();

          foreach (var element in listeVaisseauDb)
          {
               var vaisseauAcheter = listeVaisseau.First(x => x.Vaisseau.Id == element.Id);
   
               foreach (var stockage in element.ListeStockage)
               {
                    vaisseauAcheter.ListeStockage.AddRange(stockage.ListeContenuDefaut.Select(x => new StockageVaisseauPosseder
                    {
                        Logistique = new() { Id = x.Logistique.Id },
                        Quantite = x.Quantite,
                        Stockage = new() { Id = stockage.Id },
                        VaisseauPosseder = new() { Id = vaisseauAcheter.Id }
                    }));
               }

               if(vaisseauAcheter.ListeStockage.Count > 0)
               {
                    db.GetCollection<StockageVaisseauPosseder>().Insert(vaisseauAcheter.ListeStockage);
                    db.GetCollection<VaisseauPosseder>().Update(vaisseauAcheter);

                    var listeIdLogistiqueBson = vaisseauAcheter.ListeStockage.Select(x => new BsonValue(x.Logistique.Id));
                    var listeLogistique = db.GetCollection<Logistique>().Query().Where(Query.In("_id", listeIdLogistiqueBson)).ToArray();

                    // ajout des stockages dans logisitique pour la liaison
                    foreach (var element2 in vaisseauAcheter.ListeStockage)
                    {
                         var logistique = listeLogistique.FirstOrDefault(x => x.Id == element2.Logistique.Id);

                         if (logistique is null)
                              continue;

                        logistique.ListeStockageVaisseauPosseder.Add(element2);
                    }

                    db.GetCollection<Logistique>().Update(listeLogistique);
               }
          }

          var nomPersonnage = db.GetCollection<Personnage>().FindById(_httpContext.RecupererIdPersonnage()).Nom;
          db.GetCollection<Historique>().Insert(new Historique
          {
               Information = $"{nomPersonnage} à acheté(e) le vaisseau {info.Nom} pour {info.Prix}",
               Date = DateTime.UtcNow  
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

               if (!element.EstUsageUnique && element.NbTourReload <= 0)
                    return Results.BadRequest($"Le nombre de tour(s) de {element.Nom} ne peut pas être inférieur à zéro");

               if (element.Nombre <= 0)
                    return Results.BadRequest($"Le nombre de {element.Nom} ne peut pas être inférieur à zéro");

               if (element.NbNombreReloadParNbTour < 0)
                    return Results.BadRequest("Le nombre de munition recharger ne peut pas être inférieur à zéro");
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
                    return Results.BadRequest($"Le stockage {element.Nom} doit être supérieur à zéro");

               if (element.IdTypeStockage <= 0 || !db.GetCollection<TypeStockageLogistique>().Exists(x => x.Id == element.IdTypeStockage))
                return Results.NotFound($"Le type de stockage de {element.Nom} n'existe pas");

               if (element.ListeContenuDefaut.Length > 0)
               {
                    if (element.ListeContenuDefaut.Any(x => x.Quantite <= 0))
                         return Results.BadRequest("Une des quantités de contenu par défaut doit être supérieur à zéro");

                    var listeIdLogistiqueBson = element.ListeContenuDefaut.Select(x => new BsonValue(x.IdLogistique));
                    var nb = db.GetCollection<Logistique>().Query().Where(Query.In("_id", listeIdLogistiqueBson)).Count();

                    if (nb != element.ListeContenuDefaut.Length)
                         return Results.BadRequest($"Un idLogistique n'existe pas dans {element.Nom}");
               }
        }

          for (int i = 0; i < _requete.ListeIdVaisseauEnfant.Length; i++)
          {
               var element = _requete.ListeIdVaisseauEnfant[i];

               if (element <= 0)
                    return Results.BadRequest($"Le vaisseau n°{i} existe pas");
          }

          var vaisseau = db.GetCollection<Vaisseau>()
               .Include(x => x.ListeStockage)
               .Include(x => x.ListeStockage.Select(y => y.ListeContenuDefaut))
               .FindById(_idVaisseau);

          vaisseau.Nom = _requete.Nom.XSS();
          vaisseau.Role = _requete.Role.XSS();
          vaisseau.Blindage = _requete.Blindage.XSS();
          vaisseau.Vitesse = _requete.Vitesse.XSS();
          vaisseau.Prix = _requete.Prix;
          vaisseau.Stock = _requete.Stock;
          vaisseau.BloquerAchat = _requete.BloquerAchat;
          vaisseau.CapaciteSpeciale = string.IsNullOrWhiteSpace(_requete.CapaciteSpeciale) ? null : _requete.CapaciteSpeciale.XSS();
          vaisseau.Equipage.NbPlaceMarines = _requete.Equipage.NbPlaceMarines;
          vaisseau.Equipage.NbPlacePassager = _requete.Equipage.NbPlacePassager;

          if (_requete.ListeIdVaisseauEnfant.Length > 0)
          {
               var listeIdVaisseauBson = _requete.ListeIdVaisseauEnfant.Select(x => new BsonValue(x)).ToArray();

               var listeIdVaisseau = db.GetCollection<Vaisseau>().Query()
                    .Where(Query.In("_id", listeIdVaisseauBson))
                    .Select(x => x.Id)
                    .ToArray();

               if (listeIdVaisseau.Length != _requete.ListeIdVaisseauEnfant.Length)
                    return Results.BadRequest("Un ou plusieurs vaisseau(x) n'existe pas");

               vaisseau.ListeVaisseauEnPlus = [.. _requete.ListeIdVaisseauEnfant.Select(x => new Vaisseau { Id = x })];
          }
          else
               vaisseau.ListeVaisseauEnPlus = [];

          var dictArmement = vaisseau.ListeArmement
              .ToDictionary(x => x.Id);

          vaisseau.ListeArmement = [.. _requete.ListeArmement.Select(x =>
          {
               if(dictArmement.TryGetValue(x.Id, out var armementRef))
               {
                    return new ArmementVaisseau
                    {
                         Id = armementRef.Id,
                         Nombre = x.Nombre,
                         Nom = x.Nom.XSS(),
                         NbTourReload = x.NbTourReload,
                         EstUsageUnique = x.EstUsageUnique,
                         Information = string.IsNullOrWhiteSpace(x.Information) ? null : x.Information.XSS(),
                         MunitionInfini = x.MunitionInfini,
                         NbNombreReloadParNbTour = x.NbNombreReloadParNbTour
                    };
               }

               return new ArmementVaisseau
               {
                    Id = Guid.NewGuid(),
                    Nombre = x.Nombre,
                    Nom = x.Nom.XSS(),
                    NbTourReload = x.NbTourReload,
                    EstUsageUnique = x.EstUsageUnique,
                    Information = string.IsNullOrWhiteSpace(x.Information) ? null : x.Information.XSS(),
                    MunitionInfini = x.MunitionInfini,
                    NbNombreReloadParNbTour = x.NbNombreReloadParNbTour
               };
          })];

          // supprime les stockages existants qui ne sont pas dans la requete
          if (_requete.ListeStockage.Count(x => x.Id.HasValue) < vaisseau.ListeStockage.Count)
          {
               var stockageSupprimer = vaisseau.ListeStockage
                    .Where(x => !_requete.ListeStockage.Any(y => y.Id == x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        ListeIdContenuDefaut = x.ListeContenuDefaut.ConvertAll(y => y.Id)
                    })
                    .ToArray();

               for (int i = 0; i < stockageSupprimer.Length; i++)
               {
                    var listeIdBson = stockageSupprimer[i].ListeIdContenuDefaut.Select(x => new BsonValue(x)).ToArray();
                    db.GetCollection<StockageVaisseau>().Delete(stockageSupprimer[i].Id);
                    db.GetCollection<VaisseauStockageContenuDefaut>().DeleteMany(Query.In("_id", listeIdBson));
               }
          }
          
        var dictStockage = vaisseau.ListeStockage
              .ToDictionary(x => x.Id);

          vaisseau.ListeStockage = [.. _requete.ListeStockage.Select(x =>
          {
               if(x.Id.HasValue && dictStockage.TryGetValue(x.Id.Value, out var stockage))
               {
                    // le type de stockage a changer on supprime le contenu par defaut
                    if(stockage.TypeStockage.Id != x.IdTypeStockage)
                    {
                         var listeIdContenu = stockage.ListeContenuDefaut.Select(y => new BsonValue(y.Id));
                         var nb = db.GetCollection<VaisseauStockageContenuDefaut>().DeleteMany(Query.In("_id", listeIdContenu));
                         stockage.ListeContenuDefaut.Clear();
                    }

                    stockage.Nom = x.Nom.XSS();
                    stockage.Taille = x.Taille;
                    stockage.TypeStockage = new TypeStockageLogistique { Id = x.IdTypeStockage };

                    // supprimer les contenu par defaut qui ne sont pas dans la requete
                    if(x.ListeContenuDefaut.Length < stockage.ListeContenuDefaut.Count)
                    {
                         var listeStockageContenuDafautSupprimer = stockage.ListeContenuDefaut
                              .Where(y => !x.ListeContenuDefaut.Any(z => z.IdLogistique == y.Logistique.Id))
                              .Select(y => y.Id)
                              .ToArray();

                         var listeStockageContenuDafautSupprimerBson = listeStockageContenuDafautSupprimer.Select(y => new BsonValue(y));
                         db.GetCollection<VaisseauStockageContenuDefaut>().DeleteMany(Query.In("_id", listeStockageContenuDafautSupprimerBson));
                         stockage.ListeContenuDefaut.RemoveAll(y => listeStockageContenuDafautSupprimer.Contains(y.Id));
                    }
                    
                    foreach (var element in x.ListeContenuDefaut)
                    {
                         var contenuDefautBdd = stockage.ListeContenuDefaut.FirstOrDefault(y => y.Logistique.Id == element.IdLogistique);

                         if (contenuDefautBdd is not null)
                              contenuDefautBdd.Quantite = element.Quantite;

                         else
                         {
                              var nouveauStockageDefaut = new VaisseauStockageContenuDefaut
                              {
                                   Logistique = new() { Id = element.IdLogistique },
                                   Quantite = element.Quantite
                              };

                              db.GetCollection<VaisseauStockageContenuDefaut>().Insert(nouveauStockageDefaut);
                              stockage.ListeContenuDefaut.Add(nouveauStockageDefaut);
                         }
                    }

                    db.GetCollection<StockageVaisseau>().Update(stockage);
                    db.GetCollection<VaisseauStockageContenuDefaut>().Update(stockage.ListeContenuDefaut);

                    return stockage;
               }

               var listeNouveauContenuStockageDefaut = x.ListeContenuDefaut.Select(y => new VaisseauStockageContenuDefaut
               {
                    Logistique = new() { Id = y.IdLogistique },
                    Quantite = y.Quantite
               }).ToList();

               db.GetCollection<VaisseauStockageContenuDefaut>().Insert(listeNouveauContenuStockageDefaut);

               var nouveauStockage = new StockageVaisseau
               {
                    Nom = x.Nom.XSS(),
                    Taille = x.Taille,
                    TypeStockage = new TypeStockageLogistique { Id = x.IdTypeStockage },
                    Vaisseau = new Vaisseau { Id = _idVaisseau },
                    ListeContenuDefaut = listeNouveauContenuStockageDefaut
               };

               db.GetCollection<StockageVaisseau>().Insert(nouveauStockage);

               return nouveauStockage;
          })];

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

          var colVaisseau = db.GetCollection<Vaisseau>();

          if (!colVaisseau.Exists(x => x.Id == _idVaisseau))
               return Results.NotFound("Le vaisseau n'existe pas");

          var nb = db.GetCollection<VaisseauPosseder>()
               .Query()
               .Where(x => x.Vaisseau.Id == _idVaisseau)
               .Count();

          if (nb > 0)
          {
               colVaisseau.UpdateMany(_ => new Vaisseau { EstSupprimer = true }, x => x.Id == _idVaisseau);
               return Results.NoContent();
          }

          var info = colVaisseau.Query()
               .Where(x => x.Id == _idVaisseau)
               .Select(x => new
               {
                   x.NomFichier,
                   ListeIdContenuDefaut = x.ListeStockage.Select(y => y.ListeContenuDefaut.Select(z => z.Id)).ToList()
               })
               .First();

          if (info.NomFichier is not null)
               File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_VAISSEAU + info.NomFichier));

          var ok = colVaisseau.Delete(_idVaisseau);

          if (ok)
          {
               db.GetCollection<StockageVaisseau>().DeleteMany(x => x.Vaisseau.Id == _idVaisseau);

               var listeIdBson = info.ListeIdContenuDefaut.Select(x => new BsonValue(x)).ToArray();
               db.GetCollection<VaisseauStockageContenuDefaut>().DeleteMany(Query.In("_id", listeIdBson));
          }

          var listeVaisseau = colVaisseau.Query()
               .Where(x => x.ListeVaisseauEnPlus.Select(y => y.Id).Any(y => y == _idVaisseau))
               .ToArray();

          foreach (var element in listeVaisseau)
               element.ListeVaisseauEnPlus.RemoveAll(x => x.Id == _idVaisseau);

          colVaisseau.Update(listeVaisseau);

          return Results.NoContent();
     }
}
