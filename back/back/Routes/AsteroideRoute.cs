using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class AsteroideRoute
{
     public static RouteGroupBuilder AjouterRouteAsteroide(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister/{idSysteme:int}", ListerAsync)
                .WithDescription("Lister les asteroides d'un secteur")
                .Produces<AsteroideReponse[]>()
                .AllowAnonymous();

          builder.MapGet("lister-connexion", ListerConnexionAsync)
              .WithDescription("Lister les connexions entre les astéroides")
              .Produces<AsteroideConnexionReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
              .WithDescription("Ajouter un nouveau astéroide")
              .ProducesCreated<int>();

          builder.MapPost("connecter", ConnecterAsync)
              .WithDescription("Connecter deux astéroides pour afficher une route")
              .ProducesBadRequest()
              .ProducesNotFound()
              .ProducesCreated();

          builder.MapPut("modifier/{idAsteroide:int}", ModifierAsync)
              .WithDescription("Modifier un asteroide")
              .ProducesNotFound()
              .ProducesNoContent();

          builder.MapPatch("modifier-position/{idAsteroide:int}", ModifierPositionAsync)
              .WithDescription("Modifier les coordonnées d'un asteroide")
              .ProducesNotFound()
              .ProducesNoContent();

          builder.MapDelete("supprimer/{idAsteroide:int}", SupprimerAsync)
              .WithDescription("Supprimer un asteroide")
              .ProducesNoContent();

          builder.MapDelete("supprimer-connexion", SupprimerConnexionAsync)
              .WithDescription("Supprimer une connexion entre deux asteroides")
              .ProducesNoContent();

          return builder;
     }

     static async Task<IResult> ListerAsync(
          [FromRoute(Name = "idAsteroide")] int _idAsteroide
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Asteroide>().Query()
              .Where(x => x.Systeme.Id == _idAsteroide)
              .OrderBy(x => x.Nom)
              .Select(x => new AsteroideReponse
              {
                   Id = x.Id,
                   Nom = x.Nom,
                   Description = x.Description,
                   Statut = x.Statut,
                   PositionX = x.PositionX,
                   PositionY = x.PositionY,
                   IdSysteme = x.Systeme.Id
              })
              .ToList();

          return Results.Extensions.Ok(liste, AsteroideReponseContext.Default);
     }

     static async Task<IResult> ListerConnexionAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<AsteroideConnecte>().Query()
              .Select(x => new AsteroideConnexionReponse
              {
                   IdAsteroideA = x.AsteroideA.Id,
                   IdAsteroideB = x.AsteroideB.Id,
                   Distance = x.Distance
              })
              .ToList();

          return Results.Extensions.Ok(liste, SystemePlaneteConnexionReponse.Default);
     }

     static async Task<IResult> AjouterAsync(
         [FromBody] AsteroideRequete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          if (!db.GetCollection<Systeme>().Exists(x => x.Id == _requete.IdSysteme))
               return Results.NotFound("Le secteur n'existe pas");

          var grade = new Asteroide
          {
               Nom = _requete.Nom?.XSS(),
               Systeme = new Systeme { Id = _requete.IdSysteme },
               Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
               PositionX = _requete.PositionX,
               PositionY = _requete.PositionY,
               Statut = _requete.Statut
          };

          int id = db.GetCollection<Asteroide>().Insert(grade).AsInt32;

          return Results.Created("", id);
     }

     static async Task<IResult> ConnecterAsync(
         [FromBody] AsteroideConnexionRequete _requete
     )
     {
          if (_requete.IdAsteroideA <= 0 || _requete.IdAsteroideB <= 0)
               return Results.NotFound("Un des astéroides existe pas");

          if (_requete.IdAsteroideA == _requete.IdAsteroideB)
               return Results.BadRequest("L'astéroide ne peut pas pointer sur lui même");

          using var db = new LiteDatabase(Constant.BDD_NOM);
          var collection = db.GetCollection<Asteroide>();

          if (
              !collection.Exists(x => x.Id == _requete.IdAsteroideA) ||
              !collection.Exists(x => x.Id == _requete.IdAsteroideB)
          )
          {
               return Results.NotFound("Un des astéroides n'existe pas");
          }

          if (
              !db.GetCollection<AsteroideConnecte>().Exists(x =>
                  (x.AsteroideA.Id == _requete.IdAsteroideA && x.AsteroideA.Id == _requete.IdAsteroideB) ||
                  (x.AsteroideA.Id == _requete.IdAsteroideB && x.AsteroideA.Id == _requete.IdAsteroideA)
              )
          )
          {
               return Results.BadRequest("Les planetes sont déjà connectées");
          }

          db.GetCollection<AsteroideConnecte>().Insert(new AsteroideConnecte
          {
               AsteroideA = new Asteroide { Id = _requete.IdAsteroideA },
               AsteroideB = new Asteroide { Id = _requete.IdAsteroideB },
               Distance = _requete.Distance?.XSS()
          });

          return Results.Created();
     }

     static async Task<IResult> ModifierAsync(
         [FromRoute(Name = "idAsteroide")] int _idAsteroide,
         [FromBody] AsteroideRequete _requete
     )
     {
          if (_idAsteroide <= 0)
               return Results.NotFound("L'astéroide existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          if (!db.GetCollection<Systeme>().Exists(x => x.Id == _requete.IdSysteme))
               return Results.NotFound("Le systeme n'existe pas");

          var asteroide = new Asteroide
          {
               Nom = _requete.Nom?.XSS(),
               Systeme = new Systeme { Id = _requete.IdSysteme },
               Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
               PositionX = _requete.PositionX,
               PositionY = _requete.PositionY,
               Statut = _requete.Statut
          };

          var ok = db.GetCollection<Asteroide>().UpdateMany(_ => asteroide, x => x.Id == _idAsteroide);

          return ok > 0 ? Results.NoContent() : Results.NotFound("L'astéroide n'existe pas");
     }

     static async Task<IResult> ModifierPositionAsync(
          [FromRoute(Name = "idAsteroide")] int _idAsteroide,
          [FromBody] PlanetePositionRequete _requete
     )
     {
          if (_idAsteroide <= 0)
               return Results.NotFound("L'asteroide existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var nb = db.GetCollection<Asteroide>().UpdateMany(_ => new Asteroide
          {
               PositionX = _requete.PositionX,
               PositionY = _requete.PositionY
          }, x => x.Id == _idAsteroide);

          return nb > 0 ? Results.NoContent() : Results.NotFound("L'asteroide existe pas");
     }

     static async Task<IResult> SupprimerAsync(
         [FromRoute(Name = "idAsteroide")] int _idAsteroide
     )
     {
          if (_idAsteroide <= 0)
               return Results.NotFound("L'asteroide n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var ok = db.GetCollection<Asteroide>().Delete(_idAsteroide);

          if (!ok)
               return Results.NotFound("L'asteroide existe pas");

          db.GetCollection<AsteroideConnecte>().DeleteMany(x => x.AsteroideA.Id == _idAsteroide || x.AsteroideB.Id == _idAsteroide);

          return Results.NoContent();
     }

     static async Task<IResult> SupprimerConnexionAsync(
         [FromBody] AsteroideConnexionSupprimerRequete _requete
     )
     {
          if (_requete.IdAsteroideA <= 0 || _requete.IdAsteroideB <= 0)
               return Results.NotFound("Une des planetes n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var nb = db.GetCollection<AsteroideConnecte>().DeleteMany(x =>
              (x.AsteroideA.Id == _requete.IdAsteroideA && x.AsteroideA.Id == _requete.IdAsteroideB) ||
              (x.AsteroideB.Id == _requete.IdAsteroideB && x.AsteroideB.Id == _requete.IdAsteroideA)
          );

          return nb > 0 ? Results.NoContent() : Results.NotFound("La connexion existe pas");
     }
}
