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

          builder.MapGet("lister-vaisseau-compatible/{idAeronef:int}", ListerVaisseauCompatibleAsync)
              .WithDescription("Lister les vaisseaux qui possède l'aéronef et qui ont de place")
              .Produces<AeronefLegerReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un aéronef")
               .ProducesBadRequest()
               .ProducesCreated();

          builder.MapPost("acheter/{idAeronef:int}", AcheterAsync)
               .WithDescription("Acheter des aéronefs")
               .ProducesNotFound()
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

     static async Task<IResult> ListerVaisseauCompatibleAsync(
          [FromRoute(Name = "idAeronef")] int _idAeronef
     )
     {
          if (_idAeronef <= 0)
               return Results.NotFound("L'aeronef existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<VaisseauPosseder>().Query()
               .Include(x => x.Vaisseau)
               .Where(x => x.Vaisseau.ListeAeronef.Select(y => y.Aeronef.Id).Any(y => y == _idAeronef))
               .Select(x => new
               {
                    x.Id,
                    x.NomVaisseau,
                    AeronefPosseder = x.ListeAeronef.First(y => y.Aeronef.Id == _idAeronef)
               })
               .ToEnumerable()
               .Where(x => x.AeronefPosseder?.NombreDetruit > 0)
               .Select(x => new VaisseauAeronefPlaceDisponibleReponse
               {
                    Id = x.Id,
                    NomVaisseau = x.NomVaisseau,
                    NombrePlace = x.AeronefPosseder.NombreDetruit
               })
               .ToArray();

          return Results.Extensions.Ok(liste, VaisseauAeronefPlaceDisponibleReponseContext.Default);
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

     static async Task<IResult> AcheterAsync(
          [FromRoute(Name = "idAeronef")] int _idAeronef,
          [FromBody] AeronefAchaterRequete[] _requete
     )
     {
          if (_idAeronef <= 0)
               return Results.NotFound("Aeronef existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var listeIdBson = _requete.Select(x => new BsonValue(x.IdVaisseauPosseder));

          var prixUnitaireAeronef = db.GetCollection<Aeronef>().Query().Where(x => x.Id == _idAeronef).FirstOrDefault()?.Prix ?? 0;

          if(prixUnitaireAeronef is 0)
               return Results.NotFound("Aeronef existe pas");

          var dictVaisseauPosseder = db.GetCollection<VaisseauPosseder>().Query()
               .Where(Query.In("_id", listeIdBson))
               .ToList()
               .ToDictionary(x => x.Id);

          if (dictVaisseauPosseder.Count is 0)
               return Results.BadRequest("Aucun vaisseau n'a de place pour cette aeronef");

          int total = 0;
          foreach (var element in _requete)
          {
               if(dictVaisseauPosseder.TryGetValue(element.IdVaisseauPosseder, out var vaisseauPosseder))
               {
                    var aeronefPosseder = vaisseauPosseder.ListeAeronef.FirstOrDefault(x => x.Aeronef.Id == _idAeronef);
                    if (aeronefPosseder is not null)
                    {
                         total += element.Quantite * prixUnitaireAeronef;
                         aeronefPosseder.NombreDetruit -= element.Quantite;
                    }
               }
          }

          var banque = db.GetCollection<Banque>().Query().First();
          banque.Argent -= total;

          db.GetCollection<VaisseauPosseder>().Update(dictVaisseauPosseder.Values);
          db.GetCollection<Banque>().Update(banque);

          return Results.NoContent();
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
