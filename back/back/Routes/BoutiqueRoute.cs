using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class BoutiqueRoute
{
     public static RouteGroupBuilder AjouterRouteBoutique(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister/{idPersonnage:int}", ListerAsync)
               .WithDescription("Lister les objets de la boutique")
               .ProducesNotFound()
               .Produces<BoutiqueReponse[]>();

          builder.MapGet("lister-admin", (Delegate)ListerAdminAsync)
               .WithDescription("Lister tout les objets de la boutique en mode admin")
               .ProducesNotFound()
               .Produces<BoutiqueAdminReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouvel objet a l'achat dans la boutique")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPost("acheter", AcheterAsync)
               .WithDescription("Acheter un objet dans la boutique")
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapPut("modifier/{idBoutique:int}", ModifierAsync)
               .WithDescription("Modifier un objet de la boutique")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idBoutique:int}", SupprimerAsync)
               .WithDescription("Supprimer un objet de la boutique")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     async static Task<IResult> ListerAsync(
          HttpContext _httpContext,
          [FromRoute(Name = "idPersonnage")] int _idPersonnage
     )
     {
          if (_idPersonnage <= 0)
               return Results.NotFound("Le personnage n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          if(!db.GetCollection<Personnage>().Exists(x => x.Id == _idPersonnage))
               return Results.NotFound("Le personnage n'existe pas");

          var liste = db.GetCollection<Boutique>()
               .Query()
              .Include(x => x.ListePrix)
              .ToArray();

          var retour = liste.Select(x =>
          {
               // recupere la liste des objet que le personnage a acheter
               var listeAchatPersonnage = x.ListePrix.OrderBy(x => x.Ordre)
                    .Where(y => y.ListePersonnage.Any(z => z.Id == _idPersonnage))
                    .ToArray();

               var objetBoutique = new BoutiqueReponse
               {
                    Id = x.Id,
                    Description = x.Description,
                    EstPosseder = false,
                    UrlImageObjet = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_BOUTIQUE + x.NomFichier : ""
               };

               // rien acheter => premier objet
               if(listeAchatPersonnage.Length is 0)
               {
                    var premierBoutiquePrix = x.ListePrix[0];

                    objetBoutique.IdPrix = premierBoutiquePrix.Id;
                    objetBoutique.Nom = premierBoutiquePrix.Nom;
                    objetBoutique.Prix = premierBoutiquePrix.Prix;
               }
               else
               {
                    // un objet suivant est disponible
                    if(x.ListePrix.Count > listeAchatPersonnage.Length)
                    {
                         var boutiqueAchat = x.ListePrix[listeAchatPersonnage.Length];

                         objetBoutique.IdPrix = boutiqueAchat.Id;
                         objetBoutique.Nom = boutiqueAchat.Nom;
                         objetBoutique.Prix = boutiqueAchat.Prix;
                    }
                    else
                    {
                         var dernierAchat = listeAchatPersonnage.Last();

                         objetBoutique.EstPosseder = true;
                         objetBoutique.IdPrix = dernierAchat.Id;
                         objetBoutique.Nom = dernierAchat.Nom;
                         objetBoutique.Prix = dernierAchat.Prix;
                    }
               }

               return objetBoutique;
          }).ToArray();
               
          return Results.Extensions.Ok(retour, BoutiqueReponseContext.Default);
     }

     async static Task<IResult> ListerAdminAsync(
          HttpContext _httpContext
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Boutique>().Include(x => x.ListePrix)
               .Query()
               .ToArray()
               .Select(x => new BoutiqueAdminReponse
               {
                     Id = x.Id,
                     Titre = x.Titre,
                     Description = x.Description,
                     UrlImageObjet = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_BOUTIQUE + x.NomFichier : "",
                     ListePrix = x.ListePrix.Select(y => new BoutiqueAdminPrixReponse
                     {
                          Id = y.Id,
                          Nom = y.Nom,
                          Ordre = y.Ordre,
                          Prix = y.Prix
                     }).ToArray()
               }).ToArray();

          return Results.Extensions.Ok(liste, BoutiqueAdminReponseContext.Default);
     }

     async static Task<IResult> AjouterAsync(
          [FromBody] BoutiqueRequete _requete
     )
     {
          if (_requete.Description is not null && string.IsNullOrWhiteSpace(_requete.Description))
               return Results.BadRequest("La description ne peut pas être vide");

          if (_requete.ListePrix.Length == 0)
               return Results.BadRequest("Il doit y avoir au moins un prix dans la liste");

          foreach (var element in _requete.ListePrix)
          {
               if (string.IsNullOrWhiteSpace(element.Nom))
                    return Results.BadRequest("Le nom ne peut pas ête vide");

               if (element.Ordre < 0)
                    return Results.BadRequest("L'ordre ne peut pas être négatif");

               if (element.Prix <= 0)
                    return Results.BadRequest("Le prix doit être supérieur à zéro");
          }

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var boutique = new Boutique
          {
               Titre = _requete.Titre.XSS(),
               Description = _requete.Description?.XSS()
          };

          db.GetCollection<Boutique>().Insert(boutique);

          var listePrix = _requete.ListePrix.Select(x => new BoutiquePrix
          {
               Nom = x.Nom.XSS(),
               Prix = x.Prix,
               Ordre = x.Ordre,
               Boutique = boutique,
               ListePersonnage = []
          })
          .ToList();

          db.GetCollection<BoutiquePrix>().Insert(listePrix);
          boutique.ListePrix.AddRange(listePrix);

          db.GetCollection<Boutique>().Update(boutique);

          return Results.Created("", boutique.Id);
     }

     async static Task<IResult> AcheterAsync(
          HttpContext _httpContext,
          [FromBody] BoutiqueAcheterRequete _requete
     )
     {
          if (_requete.IdBoutique <= 0 || _requete.IdBoutiquePrix <= 0)
               return Results.NotFound("L'objet n'existe pas");

          var idPersonnage = _httpContext.RecupererIdPersonnage();

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var listeBoutiquePrix = db.GetCollection<BoutiquePrix>().Query()
               .OrderBy(x => x.Ordre)
               .Where(x => x.Boutique.Id == _requete.IdBoutique)
               .ToArray();

          if(!listeBoutiquePrix.Any(x => x.Id == _requete.IdBoutiquePrix))
               return Results.NotFound("L'objet n'existe pas");

          foreach (var element in listeBoutiquePrix)
          {
               var estPosseder = element.ListePersonnage.Any(x => x.Id == idPersonnage);

               if (element.Id == _requete.IdBoutiquePrix)
               {
                    if (estPosseder)
                         return Results.BadRequest("Vous possédez déjà cette objet");

                    break;
               }

               if (!estPosseder)
                    return Results.BadRequest("Vous devez acheter l'objet précédent");
          }

          var boutique = listeBoutiquePrix.First(x => x.Id == _requete.IdBoutiquePrix);

          var personnage = db.GetCollection<Personnage>().FindById(idPersonnage);

          if (boutique.Prix > personnage.NbPointBoutique)
               return Results.BadRequest("Vous n'avez pas assez de point");

          boutique.ListePersonnage.Add(personnage);
          db.GetCollection<BoutiquePrix>().Update(boutique);

          personnage.ListeBoutiquePrix.Add(boutique);
          personnage.NbPointBoutique -= boutique.Prix;
          db.GetCollection<Personnage>().Update(personnage);

          return Results.NoContent();
     }

     async static Task<IResult> ModifierAsync(
          [FromBody] BoutiqueModifierRequete _requete,
          [FromRoute(Name = "idBoutique")] int _idBoutique
     )
     {
          if (_idBoutique <= 0)
               return Results.NotFound("L'objet n'existe pas");

          if (_requete.Description is not null && string.IsNullOrWhiteSpace(_requete.Description))
               return Results.BadRequest("La description ne peut pas être vide");

          if (string.IsNullOrWhiteSpace(_requete.Titre))
               return Results.BadRequest("Le titre ne peut pas être vide");

          if (_requete.ListePrix.Length == 0)
               return Results.BadRequest("Il doit y avoir au moins un prix dans la liste");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var boutique = db.GetCollection<Boutique>().Include(x => x.ListePrix).FindById(_idBoutique);

          if (boutique is null)
               return Results.NotFound("L'objet n'existe pas");

          var listeIdPrixRequete = _requete.ListePrix.Select(x =>  x.Id).ToArray();
          var listeIdPrixSupprimer = boutique.ListePrix
               .Where(x =>  !listeIdPrixRequete.Contains(x.Id))
               .Select(x => new BsonValue(x.Id))
               .ToArray();

          if(listeIdPrixSupprimer.Length > 0)
          {
               db.GetCollection<BoutiquePrix>().DeleteMany(Query.In("_id", listeIdPrixSupprimer));

               var personnageCol = db.GetCollection<Personnage>();
               var personnagesAModifier = personnageCol
                    .Find($"ListeBoutiquePrix[*].$id ANY IN [{string.Join(",", listeIdPrixSupprimer)}]")
                    .ToList();

               foreach (var element in personnagesAModifier)
               {
                    element.ListeBoutiquePrix.RemoveAll(x => listeIdPrixSupprimer.Contains(x.Id));
                    personnageCol.Update(element);
               }
          }

          boutique.Description = _requete.Description?.XSS();
          boutique.Titre = _requete.Titre.XSS();

          var dictListePrix = boutique.ListePrix.ToDictionary(x => x.Id);
          var boutiquePrixCol = db.GetCollection<BoutiquePrix>();

          boutique.ListePrix = _requete.ListePrix.Select(x =>
          {
               if (x.Id.HasValue && dictListePrix.TryGetValue(x.Id.Value, out var boutiquePrix))
               {
                    boutiquePrix.Nom = x.Nom.XSS();
                    boutiquePrix.Ordre = x.Ordre;
                    boutiquePrix.Prix = x.Prix;

                    boutiquePrixCol.Update(boutiquePrix);
                    return boutiquePrix;
               }

               var nouveauBoutiquePrix = new BoutiquePrix
               {
                    Nom = x.Nom.XSS(),
                    Prix = x.Prix,
                    Ordre = x.Ordre,
                    Boutique = new Boutique { Id = _idBoutique }
               };

               boutiquePrixCol.Insert(nouveauBoutiquePrix);
               return nouveauBoutiquePrix;

          }).ToList();

          db.GetCollection<Boutique>().Update(boutique);

          return true ? Results.NoContent() : Results.NotFound("L'objet n'existe pas");
     }

     async static Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idBoutique")] int _idBoutique
     )
     {
          if (_idBoutique <= 0)
               return Results.NotFound("La boutique n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          bool ok = db.GetCollection<Boutique>().Delete(_idBoutique);

          if(!ok)
               return Results.NotFound("La boutique n'existe pas");

          db.GetCollection<BoutiquePrix>().DeleteMany(x => x.Boutique.Id ==  _idBoutique);
          db.GetCollection<Personnage>().DeleteMany(
               x => x.ListeBoutiquePrix.Select(y => y.Boutique.Id).Any(y => y == _idBoutique)
          );

          return Results.NoContent();
     }
}
