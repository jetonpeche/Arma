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
            .WithDescription("Lister les secteurs")
            .Produces<SecteurReponse[]>();

        builder.MapGet("lister-leger", ListerLegerAsync)
            .WithDescription("Lister les secteurs en mode leger")
            .Produces<SecteurLegerReponse[]>();

        builder.MapGet("lister-connexion", ListerConnexionAsync)
            .WithDescription("Lister les connexions entre les secteurs")
            .Produces<SecteurConnexionReponse[]>();

        builder.MapPost("ajouter", AjouterAsync)
            .WithDescription("Ajouter un secteur")
            .ProducesCreated<int>();

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

        var liste = db.GetCollection<Secteur>().Query()
            .Select(x => new SecteurReponse
            {
                Id = x.Id,
                Nom = x.Nom,
                Description = x.Description,
                PositionX = x.PositionX,
                PositionY = x.PositionY
            })
            .ToList();

        return Results.Extensions.Ok(liste, SecteurReponseContext.Default);
    }

    static async Task<IResult> ListerLegerAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<Secteur>().Query()
            .Select(x => new SecteurLegerReponse
            {
                Id = x.Id,
                Nom = x.Nom
            })
            .ToList();

        return Results.Extensions.Ok(liste, SecteurReponseContext.Default);
    }

    static async Task<IResult> ListerConnexionAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<SecteurConnecte>().Query()
            .Select(x => new SecteurConnexionReponse
            {
                IdSecteurA = x.SecteurA.Id,
                IdSecteurB = x.SecteurB.Id,
                Distance = x.Distance
            })
            .ToList();

        return Results.Extensions.Ok(liste, SecteurPlaneteConnexionReponse.Default);
    }
    
    static async Task<IResult> AjouterAsync(
        [FromBody] SecteurRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var id = db.GetCollection<Secteur>().Insert(new Secteur
        {
            Nom = _requete.Nom.XSS(),
            Description = _requete.Description?.XSS(),
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY
        });

        return Results.Created<int>("", id.AsInt32);
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idSecteur")] int _idSecteur, 
        [FromBody] SecteurRequete _requete
    )
    {
        if (_idSecteur <= 0)
            return Results.NotFound("Le secteur existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var description = _requete.Description?.XSS();
        var nom = _requete.Nom.XSS();

        var nb = db.GetCollection<Secteur>().UpdateMany(_ => new Secteur
        {
            Nom = nom,
            Description = description,
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY
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

        if (!ok)
            return Results.NotFound("Le secteur existe pas");

        db.GetCollection<SecteurConnecte>().DeleteMany(x => x.SecteurA.Id == _idSecteur || x.SecteurB.Id == _idSecteur);
        db.GetCollection<PlaneteOrigine>().UpdateMany(_ => new PlaneteOrigine { Secteur = null }, x => x.Secteur.Id == _idSecteur);

        return Results.NoContent();
    }

}
