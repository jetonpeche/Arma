using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class AeronefRoute
{
    public static RouteGroupBuilder AjouterRouteAeronef(this RouteGroupBuilder builder)
    {
        builder.MapGet("lister", (Delegate)ListerAsync)
            .WithDescription("Lister les aéronefs")
            .Produces<AeronefReponse[]>();

        builder.MapGet("lister-leger", ListerLegerAsync)
            .WithDescription("Lister les aéronefs")
            .Produces<AeronefLegerReponse[]>();

        builder.MapPost("ajouter", AjouterAsync)
            .WithDescription("Ajouter un aéronef")
            .ProducesBadRequest()
            .ProducesCreated();

        builder.MapPut("modifier/{idAeronef:int}", ModifierAsync)
            .WithDescription("Modifier un aéronef")
            .ProducesBadRequest()
            .ProducesNotFound()
            .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> ListerAsync(HttpContext _httpContext)
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<Aeronef>().Query()
            .Select(x => new AeronefReponse
            {
                Id = x.Id,
                Nom = x.Nom,
                Prix = x.Prix,
                Role = x.Role,
                Description = x.Description,
                UrlImage = x.NomImage != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_AERONEF + x.NomImage : "",
            }).ToArray();

        return Results.Extensions.Ok(liste, AeronefReponseContext.Default);
    }

    static async Task<IResult> ListerLegerAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<Aeronef>().Query()
            .OrderBy(x => x.Nom)
            .Select(x => new AeronefLegerReponse
            {
                Id = x.Id,
                Nom = x.Nom
            }).ToArray();

        return Results.Extensions.Ok(liste, AeronefReponseContext.Default);
    }

    static async Task<IResult> AjouterAsync(
        [FromBody] AeronefRequete _requete
    )
    {
        if (_requete.Prix <= 0)
            return Results.BadRequest("Le prix doit être plus grand que zéro");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        db.GetCollection<Aeronef>().Insert(new Aeronef
        {
            Nom = _requete.Nom.XSS(),
            Role = _requete.Role.XSS(),
            Description = _requete.Description?.XSS(),
            Prix = _requete.Prix
        });

        return Results.Created();
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idAeronef")] int _idAeronef,
        [FromBody] AeronefRequete _requete
    )
    {
        if (_idAeronef <= 0)
            return Results.NotFound("L'aéronef existe pas");
        
        if (_requete.Prix <= 0)
            return Results.BadRequest("Le prix doit être plus grand que zéro");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var description = _requete.Description?.XSS();
        var nom = _requete.Nom.XSS();
        var role = _requete.Role.XSS();

        var nb = db.GetCollection<Aeronef>().UpdateMany(_ => new Aeronef
        {
            Nom = nom,
            Role = role,
            Description = description,
            Prix = _requete.Prix
        }, x => x.Id == _idAeronef);

        return nb is 0 ? Results.NotFound("L'aéronef existe pas") : Results.NoContent();
    }
}
