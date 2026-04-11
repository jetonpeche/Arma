using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using System.Xml.Linq;

namespace back.Routes;

public static class HistoriqueCampagneRoute
{
     public static RouteGroupBuilder AjouterRouteHistoriqueCampagne(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
               .WithDescription("Lister les campagnes précédentes")
               .Produces<PaginationReponse<HistoriqueCampagneReponse>>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un historique de campagne")
               .ProducesBadRequest()
               .ProducesCreated();

          builder.MapDelete("supprimer-image/{idHistoriqueCampagne:int}", SupprimerImageAsync)
               .WithDescription("Supprimer une image d'une campagne")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idHistoriqueCampagne:int}", SupprimerAsync)
               .WithDescription("Supprimer un historique de campagne")
               .ProducesBadRequest()
               .ProducesNotFound()
               .ProducesCreated();

          return builder;
     }

     static async Task<IResult> ListerAsync(
          HttpContext _httpContext,
          [FromQuery(Name = "page")] int _page = 1
     )
     {
          if(_page <= 1)
               _page = 1;

          using var db = new LiteDatabase(Constant.BDD_NOM);

          string baseUrl = _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_CAMPAGNE;

          int total = db.GetCollection<HistoriqueCampagne>().Query().Count();

          var liste = db.GetCollection<HistoriqueCampagne>().Query()
               .OrderBy(x => x.Id)
               .Select(x => new HistoriqueCampagneReponse
               {
                    Id = x.Id,
                    Titre = x.Titre,
                    Texte = x.Texte,
                    ListeUrlImage = x.ListeNomFichier.Select(y => baseUrl + y)
                    .ToArray(),
               })
               .Offset((_page - 1) * 2)
               .Limit(2)
               .ToArray();

          return Results.Extensions.Ok(
               new PaginationReponse<HistoriqueCampagneReponse> 
               { 
                    Page = _page,
                    Total = total,
                    Liste = liste 
               },
               PaginationReponseContext.Default
          );
     }

     static async Task<IResult> AjouterAsync(
          HttpContext _httpContext,
          [FromBody] HistoriqueCampagneRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Texte) || string.IsNullOrWhiteSpace(_requete.Titre))
               return Results.BadRequest("Le texte et le titre sont obligatoires");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          db.GetCollection<HistoriqueCampagne>().Insert(new HistoriqueCampagne()
          {
               Titre = _requete.Titre.XSS(),
               Texte = _requete.Texte.XSS()
          });

          var nomPersonnage = db.GetCollection<Personnage>().Query()
               .Where(x => x.Id == _httpContext.RecupererIdPersonnage())
               .Select(x => x.Nom)
               .First();

          db.GetCollection<Historique>().Insert(new Historique
          {
               Information = $"{nomPersonnage} a ajouté(e) un historique de campagne: {_requete.Titre.XSS()}",
               Date = DateTime.UtcNow
          });

          return Results.Created();
     }

     static async Task<IResult> SupprimerImageAsync(
          HttpContext _httpContext,
          [FromRoute(Name = "idHistoriqueCampagne")] int _idHistoriqueCampagne,
          [FromQuery(Name = "nomFichier")] string _nomFichier
     )
     {
          if (_idHistoriqueCampagne <= 0)
               return Results.NotFound("La campagne n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var historiqueCampagne = db.GetCollection<HistoriqueCampagne>().Query()
               .Where(x => x.Id == _idHistoriqueCampagne)
               .FirstOrDefault();

          if(historiqueCampagne is null)
               return Results.NotFound("La campagne n'existe pas");

          var nomFichier = historiqueCampagne.ListeNomFichier
               .FirstOrDefault(x => x.Equals(_nomFichier.Trim(), StringComparison.OrdinalIgnoreCase));

          if (string.IsNullOrWhiteSpace(nomFichier))
               return Results.NotFound("Le fichier n'existe pas");

          File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_CAMPAGNE + nomFichier));

          historiqueCampagne.ListeNomFichier.Remove(nomFichier);

          db.GetCollection<HistoriqueCampagne>().Update(historiqueCampagne);

          return Results.NoContent();
     }

     static async Task<IResult> SupprimerAsync(
          HttpContext _httpContext,
          [FromRoute(Name = "idHistoriqueCampagne")] int _idHistoriqueCampagne
     )
     {
          if (_idHistoriqueCampagne <= 0)
               return Results.NotFound("La campagne n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var listeNomFichier = db.GetCollection<HistoriqueCampagne>().Query()
               .Where(x => x.Id == _idHistoriqueCampagne)
               .Select(x => x.ListeNomFichier)
               .FirstOrDefault();

          var ok = db.GetCollection<HistoriqueCampagne>().Delete(_idHistoriqueCampagne);

          if(listeNomFichier.Count() > 0 && ok)
          {
               foreach (var element in listeNomFichier)
                    File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_CAMPAGNE + element));
          }

          return ok ? Results.NoContent() : Results.NotFound();
     }
}
