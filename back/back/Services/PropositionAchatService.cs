using back.Enums;
using back.Models;
using back.ModelsImport;
using LiteDB;
using InfoPropositionAchat = (int Prix, string Nom, int TailleUnitaireInventaire, int IdTypeStockage);

namespace back.Services;

public sealed class PropositionAchatService
{
    public async Task<string> AcheterAsync(int _idPersonnage, List<ObjetProposerRequete> _requete)
    {
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
               .ToDictionary(x => x.Id, x => new InfoPropositionAchat(x.Prix, x.Nom, 0, 0)) : [];

          Dictionary<int, InfoPropositionAchat> dictPrixLogistique = listeIdTypeLogistique.Length > 0 ? db.GetCollection<Logistique>()
               .Find(Query.In("_id", listeIdTypeLogistique))
               .ToDictionary(x => x.Id, x => new InfoPropositionAchat(x.Prix, x.Nom, x.TailleUnitaireInventaire, x.TypeStockage.Id)) : [];

          var banque = db.GetCollection<Banque>().Query().First();

          for (int i = 0; i < _requete.Count; i++)
          {
               var element = _requete[i];

               if (element.Quantite <= 0)
                    return $"La quantité de l'objet n°{i + 1} doit être supérieur à zéro";

               if (element.IdType <= 0)
                    return "L'objet n'existe pas";

               switch (element.Type)
               {
                    case ETypeObjetProposer.Materiel:

                         if (dictPrixMateriel.TryGetValue(element.IdType, out var infoMateriel))
                         {
                              element.PrixUnitaire = infoMateriel.Prix;
                              element.Nom = infoMateriel.Nom;
                         }
                         else
                              return "L'objet n'existe pas";
                         break;

                    case ETypeObjetProposer.Logistique:

                         if (dictPrixLogistique.TryGetValue(element.IdType, out var infoLogisitique))
                         {
                              element.PrixUnitaire = infoLogisitique.Prix;
                              element.Nom = infoLogisitique.Nom;
                         
                              // recuperer le stockage choisi
                              var stockageVaisseau = db.GetCollection<VaisseauPosseder>()
                                   .Query()
                                   .Include(x => x.Vaisseau)
                                   .Include(x => x.Vaisseau.ListeStockage)
                                   .Where(x =>
                                        x.Vaisseau.Id == element.IdVaisseau
                                        && x.Vaisseau.ListeStockage.Select(y => y.Id).Any(y => y == element.IdStockage!.Value)
                                   )
                                   .FirstOrDefault()?
                                   .Vaisseau.ListeStockage
                                   .FirstOrDefault(x => x.Id == element.IdStockage!.Value && x.TypeStockage.Id == infoLogisitique.IdTypeStockage);

                              if (stockageVaisseau is null)
                                   return "Le stockage ou le vaisseau n'existe pas";

                              var stockageVaisseauPosseder = db.GetCollection<StockageVaisseauPosseder>()
                                   .Query()
                                   .ToList()
                                   .Where(x => x.Stockage.Id == element.IdStockage!.Value && x.Logistique.Id == element.IdType)
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

                         if (stockageVaisseauPosseder.Count > 0)
                              element.IdStockagePosseder = stockageVaisseauPosseder[0].Id;

                        if (element.Quantite * infoLogisitique.TailleUnitaireInventaire > placeRestante)
                              return $"{element.Nom}, place dispo: {placeRestante}, place demandée: {element.Quantite * infoLogisitique.TailleUnitaireInventaire}";
                         }
                         else
                              return "L'objet n'existe pas";
                         break;

                    default:
                         return "L'objet n'existe pas";
               }
          }

          int prixTotal = _requete.Sum(x => x.PrixUnitaire * x.Quantite);

          if (banque.Argent < prixTotal)
               return "Vousn'avez pas assez d'argent en banque";

          banque.Argent -= prixTotal;
          db.GetCollection<Banque>().Update(banque);

          var historiqueAchatCol = db.GetCollection<Historique>();

          var nomPersonnage = db.GetCollection<Personnage>()
               .Query()
               .Where(x => x.Id == _idPersonnage)
               .Select(x => x.Nom)
               .First();

          foreach (var element in _requete)
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

                    if (element.IdStockagePosseder is 0)
                    {
                         int id = db.GetCollection<StockageVaisseauPosseder>().Insert(new StockageVaisseauPosseder
                         {
                              Logistique = new Logistique { Id = element.IdType },
                              Quantite = element.Quantite,
                              VaisseauPosseder = new VaisseauPosseder { Id = element.IdVaisseau!.Value },
                              Stockage = new StockageVaisseau { Id = element.IdStockage!.Value }
                         }).AsInt32;

                         var vaisseauPosseder = db.GetCollection<VaisseauPosseder>().Query()
                              .Where(x => x.Id == element.IdVaisseau)
                              .First();

                         vaisseauPosseder.ListeStockage.Add(new StockageVaisseauPosseder { Id = id });
                         db.GetCollection<VaisseauPosseder>().Update(vaisseauPosseder);
                    }
                    else
                    {
                         db.GetCollection<StockageVaisseauPosseder>().UpdateMany(x => new StockageVaisseauPosseder
                         {
                              Quantite = x.Quantite + element.Quantite
                         },
                         x => x.Id == element.IdStockagePosseder);
                    }
               }
          }

        return "OK";
    }
}
