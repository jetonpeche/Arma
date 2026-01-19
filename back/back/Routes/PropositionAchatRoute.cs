using back.Enums;
using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using InfoPropositionAchat = (int Prix, string Nom);

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
                         Nom  = y.Nom,
                         PrixUnitaire = y.PrixUnitaire,
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
          int idPersonnage = _httpContext.RecupererIdPersonnage();

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var listeIdTypeMateriel = _requete
               .Where(x => x.Type == ETypeObjetProposer.Materiel)
               .Select(x => new BsonValue(x.IdType))
               .ToArray();

          var listeIdTypeLogistique = _requete
               .Where(x => x.Type == ETypeObjetProposer.Logistique)
               .Select(x => new BsonValue(x.IdType))
               .ToArray();

          IReadOnlyDictionary<int, InfoPropositionAchat> dictPrixMateriel = listeIdTypeMateriel.Length > 0 ? db.GetCollection<Materiel>()
               .Find(Query.In("_id", listeIdTypeMateriel))
               .ToDictionary(x =>  x.Id, x => new InfoPropositionAchat(x.Prix, x.Nom)) : [] ;

          IReadOnlyDictionary<int, InfoPropositionAchat> dictPrixLogistique = listeIdTypeLogistique.Length > 0 ? db.GetCollection<Logistique>()
               .Find(Query.In("_id", listeIdTypeLogistique))
               .ToDictionary(x => x.Id, x => new InfoPropositionAchat(x.Prix, x.Nom)) : [];

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
               Liste = _requete.Select(x =>
               {
                    return new ObjetProposer
                    {
                         IdType = x.IdType,
                         Type = x.Type,
                         Nom = x.Nom,
                         Quantite = x.Quantite,
                         PrixUnitaire = x.PrixUnitaire
                    };
               }).ToList()
          };

          int id = db.GetCollection<PropositionAchat>().Insert(propositionAchat);

          return Results.Created("", id);
     }

     async static Task<IResult> AcheterAsync(
          HttpContext _httpContext,
          [FromBody] ObjetProposerRequete _requete
     )
     {
          if (_requete.Quantite <= 0)
               return Results.BadRequest($"La quantité doit être supérieur à zéro");

          if (_requete.IdType <= 0)
               return Results.BadRequest("L'objet n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          int idPersonnage = _httpContext.RecupererIdPersonnage();

          InfoPropositionAchat info = default;

          switch (_requete.Type)
          {
               case ETypeObjetProposer.Materiel:

                    info = db.GetCollection<Materiel>().Query()
                         .Where(x => x.Id == _requete.IdType)
                         .Select(x => new InfoPropositionAchat(x.Prix, x.Nom))
                         .FirstOrDefault();
                    break;

               case ETypeObjetProposer.Logistique:

                    var logistique = db.GetCollection<Logistique>().Query()
                         .Where(x => x.Id == _requete.IdType)
                         .Select(x => new InfoPropositionAchat(x.Prix, x.Nom))
                         .FirstOrDefault();
                    break;

               default:
                    return Results.NotFound("L'objet n'existe pas");
          }

          if (info == default)
               return Results.NotFound("L'objet n'existe pas");

          _requete.Nom = info.Nom!;
          _requete.PrixUnitaire = info.Prix;

          var banque = db.GetCollection<Banque>().Query().First();
          int prixTotal = _requete.PrixUnitaire * _requete.Quantite;

          if (banque.Argent < prixTotal)
               return Results.BadRequest("Vous n'avez pas assez d'argent en banque");

          banque.Argent -= _requete.PrixUnitaire * _requete.Quantite;

          db.GetCollection<Banque>().Update(banque);

          if (_requete.Type == ETypeObjetProposer.Materiel)
          {
               db.Execute(
                    $"UPDATE {nameof(Materiel)} SET Stock = Stock + @0 WHERE Id = @1",
                    _requete.Quantite,
                    _requete.IdType
               );
          }
          else
          {
               db.Execute(
                    $"UPDATE {nameof(Logistique)} SET Stock = Stock + @0 WHERE Id = @1",
                    _requete.Quantite,
                    _requete.IdType
               );
          }

          return Results.NoContent();
     }

     async static Task<IResult> DecisionAchat(
          HttpContext _httpContext,
          [FromBody] DecisionAchatRequete _requete
     )
     {
          if (_requete.IdPropositionAchat <= 0)
               return Results.NotFound("La proposition d'achat n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var propositionAchat = db.GetCollection<PropositionAchat>().FindById(_requete.IdPropositionAchat);

          if (propositionAchat is null)
               return Results.NotFound("La ressource n'existe pas");

          var historiqueAchatCol = db.GetCollection<HistoriqueAchat>();

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
                    historiqueAchatCol.Insert(new HistoriqueAchat
                    {
                         Information = $"{nomPersonnage} a refusé la proposition d'achat de {nomPersonnageAuteurProposition}",
                         Date = DateTime.UtcNow
                    });
               }
               else
               {
                    int prixTotal = propositionAchat.Liste.Sum(x => x.PrixUnitaire * x.Quantite);

                    if (prixTotal > banque.Argent)
                         return Results.BadRequest("Vous n'avez pas assez d'argent en banque");

                    banque.Argent -= prixTotal;
                    var ok = db.GetCollection<Banque>().Update(banque);

                    if (!ok)
                         return Results.BadRequest("Erreur mise à jour de la banque");

                    foreach (var element in propositionAchat.Liste)
                    {
                         if (element.Type == ETypeObjetProposer.Materiel)
                         {
                              db.Execute(
                                   $"UPDATE {nameof(Materiel)} SET Stock = Stock + @0 WHERE _id = @1",
                                   element.Quantite,
                                   element.IdType
                              );
                         }
                         else
                         {
                              db.Execute(
                                   $"UPDATE {nameof(Logistique)} SET Stock = Stock + @0 WHERE _id = @1",
                                   element.Quantite,
                                   element.IdType
                              );
                         }

                         historiqueAchatCol.Insert(new HistoriqueAchat
                         {
                              Information = $"{nomPersonnage} a validé l'achat de {element.Nom} pour un prix de {prixTotal}",
                              Date = DateTime.UtcNow
                         });
                    }
               }

               db.GetCollection<PropositionAchat>().Delete(propositionAchat.Id);
          }

          // valide un objet de la proposition
          else
          {
               if (!_requete.Type.HasValue || !Enum.IsDefined(_requete.Type.Value))
                    return Results.BadRequest("Le type de ressource n'existe pas");

               var element = propositionAchat.Liste
                    .Where(x => x.IdType == _requete.IdType!.Value && x.Type == _requete.Type.Value)
                    .FirstOrDefault();

               if (element is null)
                    return Results.NotFound("L'objet n'existe pas");

               int prixTotal = element.PrixUnitaire * element.Quantite;

               if(_requete.AchatEstValider)
               {
                    if (prixTotal > banque.Argent)
                         return Results.BadRequest("Vous n'avez pas assez d'argent en banque");

                    banque.Argent -= prixTotal;
                    var ok = db.GetCollection<Banque>().Update(banque);

                    if (!ok)
                         return Results.BadRequest("Erreur mise à jour de la banque");

                    if (element.Type == ETypeObjetProposer.Materiel)
                    {
                         db.Execute(
                              $"UPDATE {nameof(Materiel)} SET Stock = Stock + @0 WHERE _id = @1",
                              element.Quantite,
                              element.IdType
                         );
                    }
                    else
                    {
                         db.Execute(
                              $"UPDATE {nameof(Logistique)} SET Stock = Stock + @0 WHERE _id = @1",
                              element.Quantite,
                              element.IdType
                         );
                    }

                    historiqueAchatCol.Insert(new HistoriqueAchat
                    {
                         Information = $"{nomPersonnage} a validé l'achat de {element.Nom} pour un prix de {prixTotal}",
                         Date = DateTime.UtcNow
                    });
               }
               else
               {
                    historiqueAchatCol.Insert(new HistoriqueAchat
                    {
                         Information = $"{nomPersonnage} a refusé l'achat de {element.Nom} pour un prix de {prixTotal}",
                         Date = DateTime.UtcNow
                    });
               }

               propositionAchat.Liste.Remove(element);

               if(propositionAchat.Liste.Count == 0)
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

          db.GetCollection<HistoriqueAchat>().Insert(new HistoriqueAchat
          {
               Information = $"{nomPersonnage} a supprimé ça proposition d'achat",
               Date = DateTime.UtcNow
          });

          return Results.NoContent();
     }
}
