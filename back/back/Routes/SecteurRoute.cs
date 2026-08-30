using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class SecteurRoute
{
     public static RouteGroupBuilder AjouterRouteSecteur(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
                .WithDescription("Lister les secteurs et leurs zones")
                .Produces<SecteurReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
                .WithDescription("Ajouter un secteur")
                .ProducesNotFound()
                .ProducesCreated<int>();

          builder.MapPut("synchroniser", ModifierZoneAsync)
               .WithDescription("Ajoute, modifie et supprime les cases");

          builder.MapPut("modifier/{idSecteur:int}", ModifierAsync)
                .WithDescription("Modifier un secteur")
                .ProducesNotFound()
                .ProducesNoContent();

          builder.MapPut("supprimer/{idSecteur:int}", SupprimerAsync)
                .WithDescription("Supprimer un secteur")
                .ProducesNotFound()
                .ProducesNoContent();

          return builder;
     }

     static async Task<IResult> ListerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var listeSecteur = db.GetCollection<Secteur>().Query()
               .Select(x => new SecteurReponse
               {
                    Id = x.Id,
                    Nom = x.Nom,
                    CouleurHexa = x.CouleurHexa
               })
               .ToList();

          var listeZone = db.GetCollection<SecteurZoneCarte>().Query()
               .Select(x => new
               {
                    IdSecteur = x.Secteur.Id,
                    x.PositionX,
                    x.PositionY
               })
               .ToList()
               .GroupBy(x => x.IdSecteur);

          foreach (var element in listeSecteur)
          {
               var groupe = listeZone.FirstOrDefault(g => g.Key == element.Id);

               element.ListePosition = groupe?.Select(zone => new SecteurZoneCarteReponse
               {
                    PositionX = zone.PositionX,
                    PositionY = zone.PositionY
               }).ToList() ?? [];
          }

          return Results.Extensions.Ok(listeSecteur, SecteurReponseContext.Default);
     }

     static async Task<IResult> AjouterAsync(
          [FromBody] SecteurRequete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var secteur = new Secteur
          {
               Nom = _requete.Nom.XSS(),
               CouleurHexa = _requete.CouleurHexa.XSS()
          };

          db.GetCollection<Secteur>().Insert(secteur);

          return Results.Created("", secteur.Id);
     }

     static async Task<IResult> ModifierZoneAsync(
          [FromBody] SecteurSynchroniserRequete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var col = db.GetCollection<SecteurZoneCarte>();

          foreach (var element in _requete.ListeCaseSupprimer)
               col.DeleteMany(x => x.PositionX == element.PositionX && x.PositionY == element.PositionY);

          foreach (var element in _requete.ListeCaseModifier)
          {
               col.UpdateMany(x => new SecteurZoneCarte
               {
                    Secteur = new Secteur { Id = element.IdSecteurNouveau }
               }, x => x.PositionX == element.PositionX && x.PositionY == element.PositionY);
          }

          if(_requete.ListeCaseAjouter.Count > 0)
          {
               var listeAjout = _requete.ListeCaseAjouter.ConvertAll(x => new SecteurZoneCarte
               {
                    Secteur = new Secteur { Id = x.IdSecteur },
                    PositionX = x.PositionX,
                    PositionY = x.PositionY
               });

               col.Insert(listeAjout);
          }

          return Results.NoContent();
     }

     static async Task<IResult> ModifierAsync(
          [FromRoute(Name = "idSecteur")] int _idSecteur,
          [FromBody] SecteurRequete _requete
     )
     {
          if (_idSecteur <= 0)
               return Results.NotFound("Le secteur existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var nom = _requete.Nom.XSS();
          var couleurHexa = _requete.CouleurHexa.XSS();

          var nb = db.GetCollection<Secteur>().UpdateMany(_ => new Secteur
          {
               Nom = nom,
               CouleurHexa = couleurHexa
          }, x => x.Id == _idSecteur);

          return nb > 0 ? Results.NoContent() : Results.NotFound("Le secteur existe pas");
     }

     static async Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idSecteur")] int _idSecteur
     )
     {
          if (_idSecteur <= 0)
               return Results.NotFound("Le secteur existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var ok = db.GetCollection<Secteur>().Delete(_idSecteur);

          if(!ok)
               return Results.NotFound("Le secteur existe pas");

          db.GetCollection<SecteurZoneCarte>().DeleteMany(x => x.Secteur.Id == _idSecteur);

          return Results.NoContent();
     }
}
