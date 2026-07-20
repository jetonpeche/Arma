using back.Extensions;
using back.Models;
using back.ModelsExport;
using LiteDB;

namespace back.Routes;

public static class LogRoute
{
    public static RouteGroupBuilder AjouterRouteLog(this RouteGroupBuilder builder)
    {
        builder.MapGet("derniere-entrer-perso-participer-ope", RecupererDerniereEntrerPersoParticiperOpeAsync)
            .WithDescription("Récuperer la dernière entrée des personnages impactés qui participer a une opération")
            .Produces<HistoriqueRapportOperationReponse>();

            return builder;
    }

    static async Task<IResult> RecupererDerniereEntrerPersoParticiperOpeAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var derniereEntrer = db.GetCollection<HistoriqueRapportOperation>().Query()
            .OrderByDescending(x => x.DateCreation)
            .Select(x => new HistoriqueRapportOperationReponse
            {
                Id = x.Id,
                NomAuteur = x.NomAuteur,
                ListePersonnage = x.ListePersonnage,
                DateString = x.DateCreation.ToString("g")
            })
            .FirstOrDefault();

        return Results.Extensions.Ok(derniereEntrer, HistoriqueRapportOperationReponseContext.Default);
    }
}
