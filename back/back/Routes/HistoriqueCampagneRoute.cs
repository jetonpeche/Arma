using back.Extensions;
using back.Models;
using back.ModelsExport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class HistoriqueCampagneRoute
{
     public static RouteGroupBuilder AjouterRouteHistoriqueCampagne(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
               .WithDescription("Lister les campagnes précédentes")
               .Produces<PaginationReponse<HistoriqueCampagneReponse>>();

          return builder;
     }

     static async Task<IResult> ListerAsync(
          HttpContext _httpContext,
          [FromQuery(Name = "page")] int _page = 1
     )
     {
          if(_page <= 1)
               _page = 1;

          using var db = new LiteDatabase(Constant.BDD_NOM);

          string baseUrl = _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_CAMPAGNE;

          int total = db.GetCollection<HistoriqueCampagne>().Query().Count();

          var liste = db.GetCollection<HistoriqueCampagne>().Query()
               .OrderBy(x => x.Id)
               .Select(x => new HistoriqueCampagneReponse
               {
                    Id = x.Id,
                    Texte = x.Texte,
                    ListeUrlImage = x.ListeNomFichier.Select(y => baseUrl + y)
                    .ToArray(),
               })
               .Offset((_page - 1) * 2)
               .Limit(2)
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
}
