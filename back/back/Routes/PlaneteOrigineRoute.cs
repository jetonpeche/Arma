using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class PlaneteOrigineRoute
{
    public static RouteGroupBuilder AjouterRoutePlaneteOrigine(this RouteGroupBuilder builder)
    {
        builder.MapGet("lister/{idSysteme:int}", ListerAsync)
              .WithDescription("Lister les planetes d'un secteur")
              .Produces<PlaneteOrigineReponse[]>()
              .AllowAnonymous();

          builder.MapGet("lister-origine", ListerOrigineAsync)
                .WithDescription("Lister les planetes d'origine (selectionnable pour les personnages)")
                .Produces<PlaneteOrigineLegerReponse[]>()
                .AllowAnonymous();

          builder.MapGet("lister-paginer", ListerPaginerAsync)
                .WithDescription("Lister les planetes paginer")
                .Produces<PaginationReponse<PlaneteOrigineReponse>>()
                .AllowAnonymous();

          builder.MapGet("lister-leger", ListerLegerAsync)
            .WithDescription("Lister les planetes aleger")
            .Produces<PlaneteOrigineLegerReponse[]>()
            .AllowAnonymous();

        builder.MapGet("lister-connexion", ListerConnexionAsync)
            .WithDescription("Lister les connexions entre les planetes")
            .Produces<PlaneteConnexionReponse[]>();

        builder.MapPost("ajouter", AjouterAsync)
            .WithDescription("Ajouter une nouvelle planete")
            .ProducesCreated<int>();

        builder.MapPost("connecter", ConnecterAsync)
            .WithDescription("Connecter deux planetes pour afficher une route")
            .ProducesBadRequest()
            .ProducesNotFound()
            .ProducesCreated();

        builder.MapPut("modifier/{idPlaneteOrigine:int}", ModifierAsync)
            .WithDescription("Modifier une nouvelle planete")
            .ProducesNotFound()
            .ProducesNoContent();

          builder.MapPatch("modifier-orbite/{idPlanete:int}", ModifierOrbiteAsync)
              .WithDescription("Remplacer la liste des orbites d'une planete")
              .ProducesNotFound()
              .ProducesNoContent();

          builder.MapPatch("modifier-position/{idPlanete:int}", ModifierPositionAsync)
            .WithDescription("Modifier les coordonnées d'une planete")
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapDelete("supprimer/{idPlaneteOrigine:int}", SupprimerAsync)
            .WithDescription("Supprimer une planete")
            .ProducesNoContent();

          builder.MapDelete("supprimer-connexion", SupprimerConnexionAsync)
            .WithDescription("Supprimer une connexion entre deux planetes")
            .ProducesNoContent();

        return builder;
    }

     static async Task<IResult> ListerPaginerAsync(
          HttpContext _httpContext,
          [FromQuery(Name = "thermeRecherche")] string _recherche = "",
          [FromQuery(Name = "page")] int _page = 1
     )
     {
          if (_page <= 1)
               _page = 1;

          using var db = new LiteDatabase(Constant.BDD_NOM);

          int total = db.GetCollection<PlaneteOrigine>().Query().Count();

          var requete = db.GetCollection<PlaneteOrigine>().Query()
               .OrderBy(x => x.Nom);

          if (!string.IsNullOrWhiteSpace(_recherche))
               requete = requete.Where(x => x.Nom.ToLower().Contains(_recherche.ToLower()));

          var liste = requete.Select(x => new PlaneteOrigineReponse
          {
               Id = x.Id,
               Nom = x.Nom,
               Description = x.Description,
               EstPlaneteOrigine = x.EstPlaneteOrigine,
               Statut = x.Statut,
               IdSysteme = x.Systeme.Id,
               Appartenance = x.Appartenance,
               Type = x.Type,
               PositionX = x.PositionX,
               PositionY = x.PositionY,
               NomFichier = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_PLANETE + x.NomFichier : ""
          })
          .Offset((_page - 1) * 12)
          .Limit(12)
          .ToArray();

          return Results.Extensions.Ok(
               new PaginationReponse<PlaneteOrigineReponse>
               {
                    Page = _page,
                    Total = total,
                    Liste = liste
               },
               PaginationReponseContext.Default);
     }

     static async Task<IResult> ListerAsync(
        HttpContext _httpContext,
        [FromRoute(Name = "idSysteme")] int _idSysteme
     )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<PlaneteOrigine>().Query()
            .Where(x => x.Systeme.Id == _idSysteme)
            .OrderBy(x => x.Nom)
            .Select(x => new PlaneteOrigineReponse
            {
                Id = x.Id,
                Nom = x.Nom,
                Description = x.Description,
                Statut = x.Statut,
                PositionX = x.PositionX,
                PositionY = x.PositionY,
                Appartenance = x.Appartenance,
                Type = x.Type,
                IdSysteme = x.Systeme.Id,
                EstPlaneteOrigine = x.EstPlaneteOrigine,
                ListeOrbite = x.ListeOrbite,
                NomFichier = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_PLANETE + x.NomFichier : ""
            })
            .ToList();

        return Results.Extensions.Ok(liste, PlaneteOrigineReponseContext.Default);
    }

     static async Task<IResult> ListerOrigineAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var requete = db.GetCollection<PlaneteOrigine>().Query()
               .Where(x => x.EstPlaneteOrigine)
              .OrderBy(x => x.Nom)
              .Select(x => new PlaneteOrigineLegerReponse
              {
                   Id = x.Id,
                   Nom = x.Nom
              }).ToArray();

          return Results.Extensions.Ok(requete, PlaneteOrigineLegerReponseContext.Default);
     }

    static async Task<IResult> ListerLegerAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var requete = db.GetCollection<PlaneteOrigine>().Query()
            .OrderBy(x => x.Nom)
            .Select(x => new PlaneteOrigineLegerReponse
            {
                Id = x.Id,
                Nom = x.Nom
            }).ToArray();

        return Results.Extensions.Ok(requete, PlaneteOrigineLegerReponseContext.Default);
    }

    static async Task<IResult> ListerConnexionAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<PlaneteConnecte>().Query()
            .Select(x => new PlaneteConnexionReponse
            {
                IdPlaneteA = x.PlaneteA.Id,
                IdPlaneteB = x.PlaneteB.Id,
                Distance = x.Distance
            })
            .ToList();

        return Results.Extensions.Ok(liste, SystemePlaneteConnexionReponse.Default);
    }

    static async Task<IResult> AjouterAsync(
        [FromBody] PlaneteOrigineRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        if (!db.GetCollection<Systeme>().Exists(x => x.Id == _requete.IdSysteme))
            return Results.NotFound("Le secteur n'existe pas");

        var col = db.GetCollection<PlaneteOrigine>();
        
        var grade = new PlaneteOrigine
        {
            Nom = _requete.Nom.XSS(),
            Systeme = new Systeme { Id = _requete.IdSysteme },
            Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY,
            EstPlaneteOrigine = _requete.EstPlaneteOrigine,
            Statut = _requete.Statut,
            Appartenance = _requete.Appartenance,
            Type = _requete.Type
        };

        int id = col.Insert(grade).AsInt32;

        return Results.Created("", id);
    }

    static async Task<IResult> ConnecterAsync(
        [FromBody] PlaneteConnexionRequete _requete
    )
    {
        if (_requete.IdPlaneteA <= 0 || _requete.IdPlaneteB <= 0)
            return Results.NotFound("Une des planetes existe pas");

        if (_requete.IdPlaneteA == _requete.IdPlaneteB)
            return Results.BadRequest("La planete ne peut pas pointer sur elle même");

        using var db = new LiteDatabase(Constant.BDD_NOM);
        var collection = db.GetCollection<PlaneteOrigine>();

        if (
            !collection.Exists(x => x.Id == _requete.IdPlaneteA) ||
            !collection.Exists(x => x.Id == _requete.IdPlaneteB)
        )
        {
            return Results.NotFound("Une des planètes n'existe pas.");
        }

        if (
            db.GetCollection<PlaneteConnecte>().Exists(x =>
                (x.PlaneteA.Id == _requete.IdPlaneteA && x.PlaneteB.Id == _requete.IdPlaneteB) ||
                (x.PlaneteA.Id == _requete.IdPlaneteB && x.PlaneteB.Id == _requete.IdPlaneteA)
            )
        )
        {
            return Results.BadRequest("Les planetes sont déjà connectées");
        }

        db.GetCollection<PlaneteConnecte>().Insert(new PlaneteConnecte
        {
            PlaneteA = new PlaneteOrigine { Id = _requete.IdPlaneteA },
            PlaneteB = new PlaneteOrigine { Id = _requete.IdPlaneteB },
            Distance = _requete.Distance?.XSS()
        });

        return Results.Created();
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idPlaneteOrigine")] int _idPlanete,
        [FromBody] PlaneteOrigineRequete _requete
    )
    {
        if (_idPlanete <= 0)
            return Results.NotFound("La planete existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        if (!db.GetCollection<Systeme>().Exists(x => x.Id == _requete.IdSysteme))
            return Results.NotFound("Le systeme n'existe pas");

        var ok = db.GetCollection<PlaneteOrigine>().UpdateMany(_ => new()
        {
            Nom = _requete.Nom.XSS(),
            Systeme = new Systeme { Id = _requete.IdSysteme },
            Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY,
            Statut = _requete.Statut,
            Type = _requete.Type,
            Appartenance = _requete.Appartenance,
            EstPlaneteOrigine = _requete.EstPlaneteOrigine
        }, x => x.Id == _idPlanete);

        return ok > 0 ? Results.NoContent() : Results.NotFound("La planète n'existe pas");
    }

     static async Task<IResult> ModifierOrbiteAsync(
          [FromRoute(Name = "idPlanete")] int _idPlanete,
          [FromBody] PlaneteOrbiteRequete[] _requete
     )
     {
          if (_idPlanete <= 0)
               return Results.NotFound("La planete existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = _requete.Select(x => new Orbite
          {
               OrbiteAngle = x.OrbiteAngle,
               OrbiteDecalageX = x.OrbiteDecalageX,
               OrbiteDecalageY = x.OrbiteDecalageY,
               OrbiteX = x.OrbiteX,
               OrbiteY = x.OrbiteY
          }).ToList();

          var nb = db.GetCollection<PlaneteOrigine>().UpdateMany(_ => new()
          {
               ListeOrbite = liste
          }, x => x.Id == _idPlanete);

          return nb > 0 ? Results.NoContent() : Results.NotFound("La planete existe pas");
     }

    static async Task<IResult> ModifierPositionAsync(
        [FromRoute(Name = "idPlanete")] int _idPlanete,
        [FromBody] PlanetePositionRequete _requete
    )
    {
        if (_idPlanete <= 0)
            return Results.NotFound("La planete existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var nb = db.GetCollection<PlaneteOrigine>().UpdateMany(_ => new PlaneteOrigine
        {
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY
        }, x => x.Id == _idPlanete);

        return nb > 0 ? Results.NoContent() : Results.NotFound("La planete existe pas");
    }

    static async Task<IResult> SupprimerAsync(
        [FromRoute(Name = "idPlaneteOrigine")] int _idPlanete
    )
    {
        if (_idPlanete <= 0)
            return Results.NotFound("La planete n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var planeteOrigineCol = db.GetCollection<PlaneteOrigine>();

        var nomFichier = planeteOrigineCol.Query()
               .Where(x => x.Id == _idPlanete)
               .Select(x => x.NomFichier)
               .FirstOrDefault();

        if (nomFichier is not null)
            File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_PLANETE + nomFichier));

        var ok = planeteOrigineCol.Delete(_idPlanete);

        if (!ok)
            return Results.NotFound("La planete existe pas");

        db.GetCollection<Personnage>().UpdateMany(
            _ => new Personnage { PlaneteOrigine = null }, 
            y => y.PlaneteOrigine != null && y.PlaneteOrigine.Id == _idPlanete
        );

        db.GetCollection<PlaneteConnecte>().DeleteMany(x => x.PlaneteA.Id == _idPlanete || x.PlaneteB.Id == _idPlanete);

        return Results.NoContent();
    }

    static async Task<IResult> SupprimerConnexionAsync(
        [FromBody] PlaneteConnexionSupprimerRequete _requete
    )
    {
        if (_requete.IdPlaneteA <= 0 || _requete.IdPlaneteB <= 0)
            return Results.NotFound("Une des planetes n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var nb = db.GetCollection<PlaneteConnecte>().DeleteMany(x =>
            (x.PlaneteA.Id == _requete.IdPlaneteA && x.PlaneteB.Id == _requete.IdPlaneteB) ||
            (x.PlaneteA.Id == _requete.IdPlaneteB && x.PlaneteB.Id == _requete.IdPlaneteA)
        );

        return nb > 0 ? Results.NoContent() : Results.NotFound("La connexion existe pas");
    }
}
