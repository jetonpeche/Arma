using back.Extensions;
using back.Models;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class PlaneteOrigineRoute
{
    public static RouteGroupBuilder AjouterRoutePlaneteOrigine(this RouteGroupBuilder builder)
    {
        builder.MapGet("lister", ListerAsync)
            .WithDescription("Lister les planetes")
            .Produces<PlaneteOrigine[]>();

        builder.MapPost("ajouter", AjouterAsync)
            .WithDescription("Ajouter une nouvelle planete")
            .ProducesCreated<int>();

        builder.MapPut("modifier/{idPlaneteOrigine:int}", ModifierAsync)
            .WithDescription("Modifier une nouvelle planete")
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapDelete("supprimer/{idPlaneteOrigine:int}", SupprimerAsync)
            .WithDescription("Supprimer une planete")
            .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> ListerAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var requete = db.GetCollection<PlaneteOrigine>().Query()
            .OrderBy(x => x.Nom);

        return Results.Extensions.Ok(requete.ToArray(), PlaneteOrigineContext.Default);
    }

    static async Task<IResult> AjouterAsync(
        [FromBody] PlaneteOrigineRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var col = db.GetCollection<PlaneteOrigine>();

        var grade = new PlaneteOrigine
        {
            Nom = _requete.Nom.XSS()
        };

        int id = col.Insert(grade);

        return Results.Created("", id);
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idPlaneteOrigine")] int _idPlanete,
        [FromBody] PlaneteOrigineRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var planete = new PlaneteOrigine
        {
            Id = _idPlanete,
            Nom = _requete.Nom.XSS()
        };

        var ok = db.GetCollection<PlaneteOrigine>().Update(planete);

        return ok ? Results.NoContent() : Results.NotFound("La planète n'existe pas");
    }

    static async Task<IResult> SupprimerAsync(
        [FromRoute(Name = "idPlaneteOrigine")] int _idPlanete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        db.GetCollection<PlaneteOrigine>().Delete(_idPlanete);
        db.GetCollection<Personnage>().UpdateMany(
            x => new Personnage { PlaneteOrigine = null }, 
            y => y.PlaneteOrigine != null && y.PlaneteOrigine.Id == _idPlanete
        );

        return Results.NoContent();
    }
}
