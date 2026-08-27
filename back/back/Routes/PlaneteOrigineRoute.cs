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
        builder.MapGet("lister/{idSecteur:int}", ListerAsync)
              .WithDescription("Lister les planetes d'un secteur")
              .Produces<PaginationReponse<PlaneteOrigine>>()
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

        builder.MapPatch("modifier-position/{idPlanete:int}", ModifierPositionAsync);

        builder.MapDelete("supprimer/{idPlaneteOrigine:int}", SupprimerAsync)
            .WithDescription("Supprimer une planete")
            .ProducesNoContent();

        builder.MapDelete("supprimer-connexion", SupprimerConnexionAsync)
            .WithDescription("Supprimer une connexion entre deux planetes")
            .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> ListerAsync(
         HttpContext _httpContext,
         [FromRoute(Name = "idSecteur")] int _idSecteur
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<PlaneteOrigine>().Query()
            .Where(x => x.Secteur.Id == _idSecteur)
            .OrderBy(x => x.Nom)
            .Select(x => new PlaneteOrigineReponse
            {
                Id = x.Id,
                Nom = x.Nom,
                Description = x.Description,
                Statut = x.Statut,
                PositionX = x.PositionX,
                PositionY = x.PositionY,
                IdSecteur = x.Secteur == null ? null : x.Secteur.Id,
                NomFichier = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_PLANETE + x.NomFichier : ""
            })
            .ToList();

        return Results.Extensions.Ok(liste, PlaneteOrigineReponseContext.Default);
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

        return Results.Extensions.Ok(liste, SecteurPlaneteConnexionReponse.Default);
    }

    static async Task<IResult> AjouterAsync(
        [FromBody] PlaneteOrigineRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        if (!db.GetCollection<Secteur>().Exists(x => x.Id == _requete.IdSecteur))
            return Results.NotFound("Le secteur n'existe pas");

        var col = db.GetCollection<PlaneteOrigine>();
        
        var grade = new PlaneteOrigine
        {
            Nom = _requete.Nom.XSS(),
            Secteur = new Secteur { Id = _requete.IdSecteur },
            Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY,
            Statut = _requete.Statut
        };

        int id = col.Insert(grade);

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
            !db.GetCollection<PlaneteConnecte>().Exists(x =>
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

        if (!db.GetCollection<Secteur>().Exists(x => x.Id == _requete.IdSecteur))
            return Results.NotFound("Le secteur n'existe pas");

        var ok = db.GetCollection<PlaneteOrigine>().UpdateMany(_ => new()
        {
            Nom = _requete.Nom.XSS(),
            Secteur = new Secteur { Id = _requete.IdSecteur },
            Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description.XSS(),
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY,
            Statut = _requete.Statut
        }, x => x.Id == _idPlanete);

        return ok > 0 ? Results.NoContent() : Results.NotFound("La planète n'existe pas");
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
