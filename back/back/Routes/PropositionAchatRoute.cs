using back.Enums;
using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using back.Services;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using InfoPropositionAchat = (int Prix, string Nom, int TailleUnitaireInventaire, int IdTypeStockage);

namespace back.Routes;

public static class PropositionAchatRoute
{
     public static RouteGroupBuilder AjouterRoutePropositionAchat(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
               .WithDescription("Lister les propositions d'achats")
               .Produces<PropositionAchatReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter une nouvelle proposition d'achat")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPost("acheter", AcheterAsync)
               .WithDescription("Acheter un objet sans validation")
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapPost("decision-achat", DecisionAchat)
               .WithDescription("Accepter ou refuser une proposition d'achat")
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idPropositionAchat:int}", SupprimerAsync)
               .WithDescription("Supprimer une proposition")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     async static Task<IResult> ListerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<PropositionAchat>()
               .Query()
               .Include(x => x.Personnage)
               .Select(x => new PropositionAchatReponse
               {
                    Id = x.Id,
                    Auteur = x.Personnage.Nom,
                    Liste = x.Liste.Select(y => new ObjetProposer
                    {
                         IdType = y.IdType,
                         Nom = y.Nom,
                         IdStockage = y.IdStockage,
                         IdVaisseau = y.IdVaisseau,
                        PrixUnitaire = y.PrixUnitaire,
                        NomVaisseau = y.NomVaisseau,
                        NomStockage = y.NomStockage,
                        Quantite = y.Quantite,
                         Type = y.Type
                    }).ToArray()
               }).ToArray();
               
          return Results.Extensions.Ok(liste, PropositionAchatReponseContext.Default);
     }

     async static Task<IResult> AjouterAsync(
          HttpContext _httpContext,
          [FromBody] List<ObjetProposerRequete> _requete
     )
     {
          if (_requete.Count == 0)
               return Results.BadRequest("Liste vide");

          int idPersonnage = _httpContext.RecupererIdPersonnage();

          var listeIdTypeMateriel = _requete
               .Where(x => x.Type == ETypeObjetProposer.Materiel)
               .Select(x => new BsonValue(x.IdType))
               .ToArray();

          var listeIdTypeLogistique = _requete
               .Where(x => x.Type == ETypeObjetProposer.Logistique)
               .Select(x => new BsonValue(x.IdType))
               .ToArray();

          using var db = new LiteDatabase(Constant.BDD_NOM);

          Dictionary<int, InfoPropositionAchat> dictPrixMateriel = listeIdTypeMateriel.Length > 0 ? db.GetCollection<Materiel>()
               .Find(Query.In("_id", listeIdTypeMateriel))
               .ToDictionary(x =>  x.Id, x => new InfoPropositionAchat(x.Prix, x.Nom, 0, 0)) : [] ;

          Dictionary<int, InfoPropositionAchat> dictPrixLogistique = listeIdTypeLogistique.Length > 0 ? db.GetCollection<Logistique>()
               .Find(Query.In("_id", listeIdTypeLogistique))
               .ToDictionary(x => x.Id, x => new InfoPropositionAchat(x.Prix, x.Nom, x.TailleUnitaireInventaire, x.TypeStockage.Id)) : [];

          for (int i = 0; i < _requete.Count; i++)
          {
               var element = _requete[i];

               if (element.Quantite <= 0)
                    return Results.BadRequest($"La quantité de l'objet n°{i + 1} doit être supérieur à zéro");

               if (element.IdType <= 0)
                    return Results.BadRequest("L'objet n'existe pas");

               switch (element.Type)
               {
                    case ETypeObjetProposer.Materiel:

                         if (dictPrixMateriel.TryGetValue(element.IdType, out var infoMateriel))
                         {
                              element.PrixUnitaire = infoMateriel.Prix;
                              element.Nom = infoMateriel.Nom;
                         }
                         else
                              return Results.NotFound("L'objet n'existe pas");
                         break;

                    case ETypeObjetProposer.Logistique:

                         if (dictPrixLogistique.TryGetValue(element.IdType, out var infoLogisitique))
                         {
                              element.PrixUnitaire = infoLogisitique.Prix;
                              element.Nom = infoLogisitique.Nom;
                         
                              // recuperer le stockage choisi
                              var vaisseauPosseder = db.GetCollection<VaisseauPosseder>()
                                   .Query()
                                   .Include(x => x.Vaisseau)
                                   .Include(x => x.Vaisseau.ListeStockage)
                                   .Where(x =>
                                        x.Id == element.IdVaisseau
                                        && x.Vaisseau.ListeStockage.Select(y => y.Id).Any(y => y == element.IdStockage!.Value)
                                   )
                                   .FirstOrDefault();

                              if (vaisseauPosseder is null)
                                   return Results.NotFound("Le stockage ou le vaisseau n'existe pas");

                              var stockageVaisseau = vaisseauPosseder.Vaisseau.ListeStockage
                                   .FirstOrDefault(x => x.Id == element.IdStockage!.Value && x.TypeStockage.Id == infoLogisitique.IdTypeStockage);

                              if (stockageVaisseau is null)
                                   return Results.NotFound("Le stockage ou le vaisseau n'existe pas");

                              var stockageVaisseauPosseder = db.GetCollection<StockageVaisseauPosseder>()
                                   .Query()
                                   .ToList()
                                   .Where(x => x.Stockage.Id == element.IdStockage!.Value)
                                   .Select(x => new
                                   {
                                        x.Id,
                                       IdLogistique = x.Logistique.Id,
                                       x.Quantite
                                   })
                                   .ToList();

                              var tailleMax = stockageVaisseau.Taille;
                              var tailleTotalOccuper = stockageVaisseauPosseder.Sum(x => x.Quantite);
                              var placeRestante = tailleMax - tailleTotalOccuper;

                              element.NomVaisseau = string.IsNullOrWhiteSpace(vaisseauPosseder.NomVaisseau) ? vaisseauPosseder.Vaisseau.Nom : vaisseauPosseder.NomVaisseau;
                              element.NomStockage = stockageVaisseau.Nom;
                        
                              if (element.Quantite * infoLogisitique.TailleUnitaireInventaire > placeRestante)
                                   return Results.BadRequest($"{element.Nom}, place dispo: {placeRestante}, place demandée: {element.Quantite * infoLogisitique.TailleUnitaireInventaire}");
                         }
                         else
                              return Results.NotFound("L'objet n'existe pas");
                         break;

                    default:
                         return Results.NotFound("L'objet n'existe pas");
               }
          }

          var propositionAchat = new PropositionAchat
          {
               Personnage = new Personnage { Id = idPersonnage },
               Liste = _requete.ConvertAll(x => new ObjetProposer
               {
                    IdType = x.IdType,
                    IdStockage = x.IdStockage,
                    IdVaisseau = x.IdVaisseau,
                    Type = x.Type,
                    Nom = x.Nom,
                    NomVaisseau = x.Type is ETypeObjetProposer.Logistique ? x.NomVaisseau : null,
                    NomStockage = x.NomStockage,
                    Quantite = x.Quantite,
                    PrixUnitaire = x.PrixUnitaire
              })
          };

        int id = db.GetCollection<PropositionAchat>().Insert(propositionAchat);

          return Results.Created("", id);
     }

     async static Task<IResult> AcheterAsync(
          HttpContext _httpContext,
          [FromServices] IMemoryCache _cache,
          [FromServices] PropositionAchatService _propositionServ,
          [FromBody] List<ObjetProposerRequete> _requete
     )
     {
          if (_requete.Count == 0)
               return Results.BadRequest("Liste vide");     

          int idPersonnage = _httpContext.RecupererIdPersonnage();

          var message = await _propositionServ.AcheterAsync(idPersonnage, _requete);

          if (message is "OK")
          {
               _cache.Remove("logistique");
               return  Results.NoContent();
          }
          
          return Results.BadRequest(message);
    }

     async static Task<IResult> DecisionAchat(
          HttpContext _httpContext,
          [FromServices] IMemoryCache _cache,
          [FromServices] PropositionAchatService _propositionServ,
          [FromBody] DecisionAchatRequete _requete
     )
     {
          if (_requete.IdPropositionAchat <= 0)
               return Results.NotFound("La proposition d'achat n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var propositionAchat = db.GetCollection<PropositionAchat>().FindById(_requete.IdPropositionAchat);

          if (propositionAchat is null)
               return Results.NotFound("La ressource n'existe pas");

          var historiqueAchatCol = db.GetCollection<Historique>();

          var nomPersonnage = db.GetCollection<Personnage>()
               .Query()
               .Where(x => x.Id == _httpContext.RecupererIdPersonnage())
               .Select(x => x.Nom)
               .First();

          var banque = db.GetCollection<Banque>().Query().First();

          // valide toute la proposition
          if (!_requete.Type.HasValue && !_requete.IdType.HasValue)
          {
               if (!_requete.AchatEstValider)
               {
                    var nomPersonnageAuteurProposition = db.GetCollection<PropositionAchat>()
                         .Include(x => x.Personnage)
                         .FindById(_requete.IdPropositionAchat)
                         .Personnage.Nom;

                    historiqueAchatCol.Delete(_requete.IdPropositionAchat);
                    historiqueAchatCol.Insert(new Historique
                    {
                         Information = $"{nomPersonnage} a refusé la proposition d'achat de {nomPersonnageAuteurProposition}",
                         Date = DateTime.UtcNow
                    });
               }
               else
               {
                    var liste = propositionAchat.Liste.ConvertAll(x => new ObjetProposerRequete           
                    {
                         IdStockage = x.IdStockage,
                         IdType = x.IdType,
                         Type = x.Type,
                         Quantite = x.Quantite,
                         PrixUnitaire = x.PrixUnitaire,
                         NomVaisseau = x.NomVaisseau,
                         NomStockage = x.NomStockage,
                         IdVaisseau = x.IdVaisseau,
                         Nom = x.Nom
                    });

                    var retour = await _propositionServ.AcheterAsync(_httpContext.RecupererIdPersonnage(), liste);

                    if (retour is not "OK")
                         return Results.BadRequest(retour);

                    var nomPersonnageAuteurProposition = db.GetCollection<PropositionAchat>()
                         .Include(x => x.Personnage)
                         .FindById(_requete.IdPropositionAchat)
                         .Personnage.Nom;

                    db.GetCollection<PropositionAchat>().Delete(propositionAchat.Id);

                    historiqueAchatCol.Insert(new Historique
                    {
                         Information = $"{nomPersonnage} a validé la proposition de {nomPersonnageAuteurProposition}",
                         Date = DateTime.UtcNow
                    });

                    _cache.Remove("logistique");
               }
          }

        // valide un objet de la proposition
        else
          {
               if (!_requete.Type.HasValue || !Enum.IsDefined(_requete.Type.Value))
                    return Results.BadRequest("Le type de ressource n'existe pas");

               
               var element = propositionAchat.Liste
                    .FirstOrDefault(x => x.IdType == _requete.IdType!.Value && x.Type == _requete.Type.Value);

               if (element is null)
                    return Results.NotFound("L'objet n'existe pas");

               var objet = new ObjetProposerRequete           
               {
                    IdStockage = element.IdStockage,
                    IdType = element.IdType,
                    Type = element.Type,
                    Quantite = element.Quantite,
                    PrixUnitaire = element.PrixUnitaire,
                    NomVaisseau = element.NomVaisseau,
                    IdVaisseau = element.IdVaisseau,
                    Nom = element.Nom
               };

               if(_requete.AchatEstValider)
               {
                    var retour = await _propositionServ.AcheterAsync(_httpContext.RecupererIdPersonnage(), [objet]);

                    if (retour is not "OK")
                         return Results.BadRequest(retour);

                    historiqueAchatCol.Insert(new Historique
                    {
                         Information = $"{nomPersonnage} a validé l'achat de {element.Nom} pour un prix de {objet.PrixUnitaire * objet.Quantite}",
                         Date = DateTime.UtcNow
                    });

                    _cache.Remove("logistique");
               }
               else
               {
                    historiqueAchatCol.Insert(new Historique
                    {
                         Information = $"{nomPersonnage} a refusé l'achat de {element.Nom} pour un prix de {objet.PrixUnitaire * objet.Quantite}",
                         Date = DateTime.UtcNow
                    });
               }

               propositionAchat.Liste.Remove(element);

               if(propositionAchat.Liste.Count is 0)
                    db.GetCollection<PropositionAchat>().Delete(_requete.IdPropositionAchat);

               else
                    db.GetCollection<PropositionAchat>().Update(propositionAchat);
          }

          return Results.NoContent();
     }

     async static Task<IResult> SupprimerAsync(
          HttpContext _httpContext,
          [FromRoute(Name = "idPropositionAchat")] int _idPropositionAchat
     )
     {
          var idPersonnage = _httpContext.RecupererIdPersonnage();

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var existe = db.GetCollection<PropositionAchat>()
               .Exists(x => x.Personnage.Id == idPersonnage && x.Id == _idPropositionAchat);

          if(!existe)
               return Results.NotFound("La proposition n'existe pas");

          var nomPersonnage = db.GetCollection<Personnage>().Query()
               .Where(x => x.Id == idPersonnage)
               .Select(x => x.Nom)
               .First();

          db.GetCollection<PropositionAchat>().Delete(_idPropositionAchat);

          db.GetCollection<Historique>().Insert(new Historique
          {
               Information = $"{nomPersonnage} a supprimé ça proposition d'achat",
               Date = DateTime.UtcNow
          });

          return Results.NoContent();
     }
}
