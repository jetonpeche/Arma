using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class SystemeRoute
{
    public static RouteGroupBuilder AjouterRouteSysteme(this RouteGroupBuilder builder)
    {
        builder.MapGet("lister", ListerAsync)
            .WithDescription("Lister les systemes")
            .Produces<SystemeReponse[]>();

        builder.MapGet("lister-leger", ListerLegerAsync)
            .WithDescription("Lister les systemes en mode leger")
            .Produces<SystemeLegerReponse[]>();

        builder.MapGet("lister-connexion", ListerConnexionAsync)
            .WithDescription("Lister les connexions entre les systemes")
            .Produces<SystemeConnexionReponse[]>();

        builder.MapPost("ajouter", AjouterAsync)
            .WithDescription("Ajouter un systeme")
            .ProducesCreated<int>();

        builder.MapPost("connecter", ConnecterAsync)
            .WithDescription("Connecter deux systemes pour afficher une route")
            .ProducesBadRequest()
            .ProducesNotFound()
            .ProducesCreated();

        builder.MapPut("modifier/{idSysteme:int}", ModifierAsync)
            .WithDescription("Modifier un systeme")
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapPatch("modifier-position/{idSysteme:int}", ModifierPositionAsync)
            .WithDescription("Modifier les coordonnées d'un systeme")
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapDelete("supprimer/{idSysteme:int}", SupprimerAsync)
            .WithDescription("Supprimer un systeme")
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapDelete("supprimer-connexion", SupprimerConnexionAsync)
            .WithDescription("Supprimer une connexion entre deux systemes")
            .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> ListerAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<Systeme>().Query()
            .Select(x => new SystemeReponse
            {
                Id = x.Id,
                Nom = x.Nom,
                Description = x.Description,
                PositionX = x.PositionX,
                PositionY = x.PositionY
            })
            .ToList();

        return Results.Extensions.Ok(liste, SystemeReponseContext.Default);
    }

    static async Task<IResult> ListerLegerAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<Systeme>().Query()
            .Select(x => new SystemeLegerReponse
            {
                Id = x.Id,
                Nom = x.Nom
            })
            .ToList();

        return Results.Extensions.Ok(liste, SystemeReponseContext.Default);
    }

    static async Task<IResult> ListerConnexionAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<SystemeConnecte>().Query()
            .Select(x => new SystemeConnexionReponse
            {
                IdSystemeA = x.SystemeA.Id,
                IdSystemeB = x.SystemeB.Id,
                Distance = x.Distance
            })
            .ToList();

        return Results.Extensions.Ok(liste, SystemePlaneteConnexionReponse.Default);
    }
    
    static async Task<IResult> AjouterAsync(
        [FromBody] SystemeRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var id = db.GetCollection<Systeme>().Insert(new Systeme
        {
            Nom = _requete.Nom.XSS(),
            Description = _requete.Description?.XSS(),
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY
        });

        return Results.Created<int>("", id.AsInt32);
    }

    static async Task<IResult> ConnecterAsync(
        [FromBody] SystemeConnexionRequete _requete
    )
    {
        if (_requete.IdSystemeA <= 0 || _requete.IdSystemeB <= 0)
            return Results.NotFound("Un des systemes existe pas");

        if (_requete.IdSystemeA == _requete.IdSystemeB)
            return Results.BadRequest("Le systeme ne peut pas pointer sur sui même");

        using var db = new LiteDatabase(Constant.BDD_NOM);
        var collection = db.GetCollection<Systeme>();

        if (
            !collection.Exists(x => x.Id == _requete.IdSystemeA) ||
            !collection.Exists(x => x.Id == _requete.IdSystemeB)
        )
        {
            return Results.NotFound("Un des systemes n'existe pas");
        }

        if (
            db.GetCollection<SystemeConnecte>().Exists(x =>
                (x.SystemeA.Id == _requete.IdSystemeA && x.SystemeB.Id == _requete.IdSystemeB) ||
                (x.SystemeA.Id == _requete.IdSystemeB && x.SystemeB.Id == _requete.IdSystemeA)
            )
        )
        {
            return Results.BadRequest("Les systemes sont déjà connectés");
        }

        var systemeConnecter = new SystemeConnecte
        {
            SystemeA = new Systeme { Id = _requete.IdSystemeA },
            SystemeB = new Systeme { Id = _requete.IdSystemeB },
            Distance = string.IsNullOrWhiteSpace(_requete.Distance) ? null : _requete.Distance.XSS()
        };

        db.GetCollection<SystemeConnecte>().Insert(systemeConnecter);

        return Results.Created();
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idSysteme")] int _idSysteme, 
        [FromBody] SystemeRequete _requete
    )
    {
        if (_idSysteme <= 0)
            return Results.NotFound("Le systeme existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var description = _requete.Description?.XSS();
        var nom = _requete.Nom.XSS();

        var nb = db.GetCollection<Systeme>().UpdateMany(_ => new Systeme
        {
            Nom = nom,
            Description = description,
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY
        }, x => x.Id == _idSysteme);

        return nb > 0 ? Results.NoContent() : Results.NotFound("Le systeme existe pas");
    }

        static async Task<IResult> ModifierPositionAsync(
        [FromRoute(Name = "idSysteme")] int _idSysteme,
        [FromBody] PlanetePositionRequete _requete
    )
    {
        if (_idSysteme <= 0)
            return Results.NotFound("Le systeme existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var nb = db.GetCollection<Systeme>().UpdateMany(_ => new Systeme
        {
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY
        }, x => x.Id == _idSysteme);

        return nb > 0 ? Results.NoContent() : Results.NotFound("Le systeme existe pas");
    }

    static async Task<IResult> SupprimerAsync(
        [FromRoute(Name = "idSysteme")] int _idSysteme
    )
    {
        if (_idSysteme <= 0)
            return Results.NotFound("Le systeme existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var ok = db.GetCollection<Systeme>().Delete(_idSysteme);

        if (!ok)
            return Results.NotFound("Le systeme existe pas");

        db.GetCollection<SystemeConnecte>().DeleteMany(x => x.SystemeA.Id == _idSysteme || x.SystemeB.Id == _idSysteme);

        var listeIdPlanete = db.GetCollection<PlaneteOrigine>().Query()
            .Where(x => x.Systeme.Id == _idSysteme)
            .Select(x => x.Id)
            .ToList();

        db.GetCollection<PlaneteConnecte>().DeleteMany(x => listeIdPlanete.Contains(x.PlaneteA.Id) || listeIdPlanete.Contains(x.PlaneteB.Id));
        db.GetCollection<PlaneteOrigine>().DeleteMany(x => x.Systeme.Id == _idSysteme);

        return Results.NoContent();
    }

    static async Task<IResult> SupprimerConnexionAsync(
        [FromBody] SystemeConnexionSupprimerRequete _requete
    )
    {
        if (_requete.IdSystemeA <= 0 || _requete.IdSystemeB <= 0)
            return Results.NotFound("Un des systemes n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var nb = db.GetCollection<SystemeConnecte>().DeleteMany(x =>
            (x.SystemeA.Id == _requete.IdSystemeA && x.SystemeB.Id == _requete.IdSystemeB) ||
            (x.SystemeA.Id == _requete.IdSystemeB && x.SystemeB.Id == _requete.IdSystemeA)
        );

        return nb > 0 ? Results.NoContent() : Results.NotFound("La connexion existe pas");
    }
}
