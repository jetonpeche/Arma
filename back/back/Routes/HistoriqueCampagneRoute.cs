using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace back.Routes;

public static class HistoriqueCampagneRoute
{
     private const string NOM_CACHE_CAMPAGNE = "campagne";
     
    public static RouteGroupBuilder AjouterRouteHistoriqueCampagne(this RouteGroupBuilder builder)
    {
          builder.MapGet("lister-campagne", ListerCampagneAsync)
               .WithDescription("Lister les campagnes")
               .Produces<PaginationReponse<HistoriqueCampagneReponse>>()
               .AllowAnonymous();

          builder.MapGet("lister-historique/{idCampagne:int}", ListerHistoriqueAsync)
               .WithDescription("Lister l'historique d'une campagne")
               .Produces<PaginationReponse<HistoriqueCampagneReponse>>()
               .AllowAnonymous();

          builder.MapPost("ajouter-historique", AjouterHistoriqueAsync)
               .WithDescription("Ajouter un historique de campagne")
               .ProducesBadRequest()
               .ProducesCreated();

          builder.MapPost("ajouter-campagne", AjouterCampagneAsync)
               .WithDescription("Modifier une campagne")
               .ProducesBadRequest()
               .ProducesNoContent();

        builder.MapPut("modifier-historique/{idHistoriqueCampagne:int}", ModifierHistoriqueAsync)
               .WithDescription("Modifier un historique de campagne")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();

        builder.MapPut("modifier-campagne/{idCampagne:int}", ModifierCampagneAsync)
               .WithDescription("Modifier une campagne")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer-image/{idHistoriqueCampagne:int}", SupprimerImageAsync)
               .WithDescription("Supprimer une image d'une campagne")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();


          builder.MapDelete("supprimer-campagne/{idCampagne:int}", SupprimerCampagneAsync)
               .WithDescription("Supprimer une campagne")
               .ProducesBadRequest()
               .ProducesNotFound()
               .ProducesCreated();

          builder.MapDelete("supprimer-historique/{idHistoriqueCampagne:int}", SupprimerHistoriqueAsync)
               .WithDescription("Supprimer un historique de campagne")
               .ProducesBadRequest()
               .ProducesNotFound()
               .ProducesCreated();

          return builder;
    }

    static async Task<IResult> ListerCampagneAsync(
          [FromServices] IMemoryCache _cache
    )
    {
          var liste = await _cache.GetOrCreateAsync(NOM_CACHE_CAMPAGNE, async cache =>
          {
               using var db = new LiteDatabase(Constant.BDD_NOM);

               var liste = db.GetCollection<Campagne>().Query()
                    .Select(x => new
                    {
                    x.Id,
                    x.Nom,
                    x.Resumer,
                    x.IntervalDate
                    })
                    .ToList();

               if (liste.Count > 0)
               {
                    cache.SlidingExpiration = TimeSpan.FromMinutes(5);
                    cache.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(20);
               }

               return liste;
          });

          return Results.Ok(liste);
    }
    
    static async Task<IResult> ListerHistoriqueAsync(
          HttpContext _httpContext,
          [FromRoute(Name = "idCampagne")] int _idCampagne,
          [FromQuery(Name = "page")] int _page = 1
     )
     {
          if(_page <= 1)
               _page = 1;

          using var db = new LiteDatabase(Constant.BDD_NOM);

          string baseUrl = _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_CAMPAGNE;

          int total = db.GetCollection<HistoriqueCampagne>().Query().Count();

        var liste = db.GetCollection<HistoriqueCampagne>().Query()
               .Where(x => x.Campagne.Id == _idCampagne)
               .Include(x => x.Planete)
               .OrderBy(x => x.Id)
               .Select(x => new HistoriqueCampagneReponse
               {
                    Id = x.Id,
                    IdCampagne = x.Campagne.Id,
                    Date = x.Date,
                    Titre = x.Titre,
                    Texte = x.Texte,
                    CodeOperation = x.CodeOperation,
                    Planete = x.Planete != null ? new()
                    {
                         Id = x.Planete.Id,
                         Nom = x.Planete.Nom
                    } : null,
                    ListeUrlImage = x.ListeNomFichier.Select(y => baseUrl + y)
                         .ToArray(),
               })
               .Offset((_page - 1) * 5)
               .Limit(5)
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

    static async Task<IResult> AjouterCampagneAsync(
          [FromServices] IMemoryCache _cache,
          [FromBody] CampagneRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom est obligatoire");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          db.GetCollection<Campagne>().Insert(new Campagne
          {
               Nom = _requete.Nom.XSS(),
               Resumer = string.IsNullOrWhiteSpace(_requete.Resumer) ? null : _requete.Resumer?.XSS(),
               IntervalDate = string.IsNullOrWhiteSpace(_requete.IntervalDate) ? null : _requete.IntervalDate?.XSS()
          });

          _cache.Remove(NOM_CACHE_CAMPAGNE);

          return Results.Created();
    }


    static async Task<IResult> AjouterHistoriqueAsync(
          HttpContext _httpContext,
          [FromBody] HistoriqueCampagneRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Texte) || string.IsNullOrWhiteSpace(_requete.Titre))
               return Results.BadRequest("Le texte et le titre sont obligatoires");

          if (_requete.IdPlanete <= 0)
               return Results.BadRequest("La planete n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          if (!db.GetCollection<PlaneteOrigine>().Exists(x => x.Id == _requete.IdPlanete))
            return Results.BadRequest("La planete n'existe pas");

          if (!db.GetCollection<Campagne>().Exists(x => x.Id == _requete.IdCampagne))
               return Results.BadRequest("La campagne n'existe pas");

        var id = db.GetCollection<HistoriqueCampagne>().Insert(new HistoriqueCampagne
          {
               Date = _requete.Date.XSS(),
               Titre = _requete.Titre.XSS(),
               Texte = _requete.Texte.XSS(),
               CodeOperation = _requete.CodeOperation.XSS(),
               Campagne = new Campagne { Id = _requete.IdCampagne },
               Planete = new PlaneteOrigine { Id = _requete.IdPlanete }
          }).AsInt32;

          var nomPersonnage = db.GetCollection<Personnage>().Query()
               .Where(x => x.Id == _httpContext.RecupererIdPersonnage())
               .Select(x => x.Nom)
               .First();

          db.GetCollection<Historique>().Insert(new Historique
          {
               Information = $"{nomPersonnage} a ajouté(e) un historique de campagne: {_requete.Titre.XSS()}",
               Date = DateTime.UtcNow
          });

          return Results.Created("", id);
    }

    static async Task<IResult> ModifierCampagneAsync(
          [FromServices] IMemoryCache _cache,
          [FromRoute(Name = "idCampagne")] int _idCampagne,
          [FromBody] CampagneRequete _requete
     )
     {
          if (_idCampagne <= 0)
               return Results.NotFound("La campa existe pas");

          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom est obligatoire");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var resumer = string.IsNullOrWhiteSpace(_requete.Resumer) ? null : _requete.Resumer?.XSS();
          var IntervalDate = string.IsNullOrWhiteSpace(_requete.IntervalDate) ? null : _requete.IntervalDate?.XSS();
          var nom = _requete.Nom.XSS();

          var nb = db.GetCollection<Campagne>().UpdateMany(x => new Campagne
          {
               Nom = nom,
               Resumer = resumer,
               IntervalDate = IntervalDate
          }, x => x.Id == _idCampagne);

          if (nb > 0)
          {
               _cache.Remove(NOM_CACHE_CAMPAGNE);
               return Results.NoContent();
          }

          return Results.NotFound("La campa existe pas");
    }

    static async Task<IResult> ModifierHistoriqueAsync(
          HttpContext _httpContext,
          [FromRoute(Name = "idHistoriqueCampagne")] int _idHistoriqueCampagne,
          [FromBody] HistoriqueCampagneRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Texte) || string.IsNullOrWhiteSpace(_requete.Titre))
               return Results.BadRequest("Le texte et le titre sont obligatoires");

          if (_requete.IdPlanete <= 0)
               return Results.BadRequest("La planete n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          if (!db.GetCollection<PlaneteOrigine>().Exists(x => x.Id == _requete.IdPlanete))
               return Results.BadRequest("La planete n'existe pas");

          if (!db.GetCollection<Campagne>().Exists(x => x.Id == _requete.IdCampagne))
               return Results.BadRequest("La campagne n'existe pas");

        var id = db.GetCollection<HistoriqueCampagne>().UpdateMany(_ => new HistoriqueCampagne
          {
               Date = _requete.Date.XSS(),
               Titre = _requete.Titre.XSS(),
               Texte = _requete.Texte.XSS(),
               CodeOperation = _requete.CodeOperation.XSS(),
               Campagne = new Campagne { Id = _requete.IdCampagne },
               Planete = new PlaneteOrigine { Id = _requete.IdPlanete }
          }, x => x.Id == _idHistoriqueCampagne);

          var nomPersonnage = db.GetCollection<Personnage>().Query()
               .Where(x => x.Id == _httpContext.RecupererIdPersonnage())
               .Select(x => x.Nom)
               .First();

          db.GetCollection<Historique>().Insert(new Historique
          {
               Information = $"{nomPersonnage} a modifié(e) l'historique de campagne: {_requete.Titre.XSS()}",
               Date = DateTime.UtcNow
          });

          return Results.NoContent();
     }

     static async Task<IResult> SupprimerImageAsync(
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

     static async Task<IResult> SupprimerHistoriqueAsync(
          [FromRoute(Name = "idHistoriqueCampagne")] int _idHistoriqueCampagne
     )
     {
          if (_idHistoriqueCampagne <= 0)
               return Results.NotFound("La campagne n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var listeNomFichier = db.GetCollection<HistoriqueCampagne>().Query()
               .Where(x => x.Id == _idHistoriqueCampagne)
               .FirstOrDefault()?.ListeNomFichier ?? [];

          var ok = db.GetCollection<HistoriqueCampagne>().Delete(_idHistoriqueCampagne);

          if(listeNomFichier.Count > 0 && ok)
          {
               foreach (var element in listeNomFichier)
                    File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_CAMPAGNE + element));
          }

          return ok ? Results.NoContent() : Results.NotFound();
    }

    static async Task<IResult> SupprimerCampagneAsync(
          [FromServices] IMemoryCache _cache,
         [FromRoute(Name = "idCampagne")] int _idCampagne
     )
     {
          if (_idCampagne <= 0)
               return Results.NotFound("La campagne existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var listeHistoriqueCampagne = db.GetCollection<HistoriqueCampagne>()
               .Query()
               .Where(x => x.Campagne.Id == _idCampagne)
               .ToList();

          if (listeHistoriqueCampagne.Count is 0)
               return Results.NotFound("La campagne existe pas");

          var tousLesFichiers = listeHistoriqueCampagne.SelectMany(c => c.ListeNomFichier);

          foreach (var nomFichier in tousLesFichiers)
               File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_CAMPAGNE + nomFichier));

          db.GetCollection<HistoriqueCampagne>().DeleteMany(x => x.Campagne.Id == _idCampagne);

          _cache.Remove(NOM_CACHE_CAMPAGNE);
          
          return Results.NoContent();
    }
}
