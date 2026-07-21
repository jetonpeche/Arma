using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace back.Routes;

public static class FormationRoute
{
    const string NOM_CACHE = "formation";
    
    public static RouteGroupBuilder AjouterRouteFormation(this RouteGroupBuilder builder)
    {
        builder.MapGet("lister", ListerAsync)
            .WithDescription("Lister les formations dans le bon ordre")
            .Produces<Formation[]>();

          builder.MapGet("lister-leger", ListerLegerAsync)
              .WithDescription("Lister les formations dans le bon ordre")
              .Produces<FormationLegerReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
            .WithDescription("Ajouter une nouvelle description")
            .ProducesBadRequest()
            .ProducesCreated();

        builder.MapPut("modifier/{idFormation}", ModifierAsync)
            .WithDescription("Modifier une description")
            .ProducesBadRequest()
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapDelete("supprimer/{idFormation}", SupprimerAsync)
            .WithDescription("Supprimer une formation")
            .ProducesNotFound()
            .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> ListerAsync(
        [FromServices] IMemoryCache _cache
    )
    {
        var liste = await _cache.GetOrCreateAsync(NOM_CACHE, async cache =>
        {
            using var db = new LiteDatabase(Constant.BDD_NOM);
            
            var liste = db.GetCollection<Formation>().Query()
                .OrderBy(x => x.Ordre)
                .ToArray();

               if (liste.Length > 0)
               {
                    cache.SlidingExpiration = TimeSpan.FromMinutes(2);
                    cache.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
                }

            return liste;
        });

        return Results.Extensions.Ok(liste, FormationContext.Default);
    }

     static async Task<IResult> ListerLegerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Formation>().Query()
              .OrderBy(x => x.Ordre)
              .Select(x => new FormationLegerReponse
              {
                   Id = x.Id,
                   NomComplet = x.NomComplet,
                   NomRaccourci = x.NomRaccourci
              })
              .ToArray();

          return Results.Extensions.Ok(liste, FormationLegerReponseContext.Default);
     }

    static async Task<IResult> AjouterAsync(
        [FromServices] IMemoryCache _cache,
        [FromBody] FormationRequete _requete
    )
    {
        if (string.IsNullOrWhiteSpace(_requete.NomComplet))
            return Results.BadRequest("Le nom est obligatoire");

        if (string.IsNullOrWhiteSpace(_requete.NomRaccourci))
            return Results.BadRequest("Le raccourci est obligatoire");

        if (_requete.Ordre < 0)
            return Results.BadRequest("L'ordre doit être supérieur à zéro");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        db.GetCollection<Formation>().Insert(new Formation
        {
            ConditionReussite = _requete.ConditionReussite.XSS(),
            NomComplet = _requete.NomComplet.XSS(),
            NomRaccourci = _requete.NomRaccourci.XSS(),
            Ordre = _requete.Ordre,
            Objectif = _requete.Objectif.XSS(),
            PersonnelleRequis = [.. _requete.PersonnelleRequis.Select(x => x.XSS())],
            ListeEtapeFormation = _requete.ListeEtapeFormation.ConvertAll(x => new FormationEtape
            {
                Description = x.Description.XSS(),
                NumeroEtape = x.NumeroEtape
            })
        });

        _cache.Remove(NOM_CACHE);

        return Results.Created();
    }

    static async Task<IResult> ModifierAsync(
        [FromServices] IMemoryCache _cache,
        [FromRoute(Name = "idFormation")] int _idFormation, 
        [FromBody] FormationRequete _requete
    )
    {
        if (_idFormation <= 0)
            return Results.NotFound("La formation n'existe pas");

        if (string.IsNullOrWhiteSpace(_requete.NomComplet))
            return Results.BadRequest("Le nom est obligatoire");

        if (string.IsNullOrWhiteSpace(_requete.NomRaccourci))
            return Results.BadRequest("Le raccourci est obligatoire");

        if (_requete.Ordre < 0)
            return Results.BadRequest("L'ordre doit être supérieur à zéro");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var formation = db.GetCollection<Formation>().FindById(_idFormation);

        if (formation is null)
            return Results.NotFound("La formation n'existe pas");

        formation.ConditionReussite = _requete.ConditionReussite.XSS();
        formation.NomComplet = _requete.NomComplet.XSS();
        formation.NomRaccourci = _requete.NomRaccourci.XSS();
        formation.Objectif = _requete.Objectif.XSS();
        formation.Ordre = _requete.Ordre;
        formation.PersonnelleRequis = [.. _requete.PersonnelleRequis.Select(x => x.XSS())];
        formation.ListeEtapeFormation = _requete.ListeEtapeFormation.ConvertAll(x => new FormationEtape
        {
            Description = x.Description.XSS(),
            NumeroEtape = x.NumeroEtape
        });

        db.GetCollection<Formation>().Update(formation);

        _cache.Remove(NOM_CACHE);

        return Results.NoContent();
    }

    static async Task<IResult> SupprimerAsync(
        [FromServices] IMemoryCache _cache,
        [FromRoute(Name = "idFormation")] int _idFormation
    )
    {
        if (_idFormation <= 0)
            return Results.NotFound("La formation n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var ok = db.GetCollection<Formation>().Delete(_idFormation);

        if (ok)
        {
            _cache.Remove(NOM_CACHE);
            return Results.NoContent();
        }

        return Results.NotFound("La formation n'existe pas");
    }
}
