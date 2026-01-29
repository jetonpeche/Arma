
using back.Extensions;
using back.Models;
using LiteDB;

namespace back.Middlewares;

public class DroitMiddleware : IEndpointFilter
{
     public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
     {
          // recupere le groupe de l'endpoint
          var routeSplit = context.HttpContext.Request.Path.Value!.Split('/');
          string nomMapGroupe = routeSplit[2];

          if (nomMapGroupe is "authentification" or "test")
               return await next(context);

          using var db = new LiteDatabase(Constant.BDD_NOM);

          int idPersonnage = context.HttpContext.RecupererIdPersonnage();

          var droitProgrammer = db.GetCollection<Personnage>()
               .Query()
               .Include(x => x.DroitGroupe)
               .Where(x => x.Id == idPersonnage)
               .Select(x => x.DroitGroupe)
               .FirstOrDefault();

          if (droitProgrammer is null)
               return Results.NotFound("Le personnage n'existe pas");

          string verbeHttp = context.HttpContext.Request.Method;

          var droit = droitProgrammer.ListeDroit
               .Where(x => x.RouteGroupe == nomMapGroupe)
               .FirstOrDefault();

          if (droit is null)
               return Results.Forbid();

          if(verbeHttp == HttpMethods.Get)
          {
               if(!droit.PeutLire)
                    return Results.Forbid();
          }
          else if(verbeHttp == HttpMethods.Post || verbeHttp == HttpMethods.Put)
          {
               // regles pour les achats de vaisseau, boutique ou de materiel en direct
               if (nomMapGroupe is "vaisseau" or "proposition-achat" or "boutique" && routeSplit.Length > 3 && routeSplit[3] == "acheter")
               {
                    if(nomMapGroupe == "vaisseau" && !droitProgrammer.PeutAcheterVaisseau)
                         return Results.Forbid();

                    if(nomMapGroupe == "proposition-achat" && !droitProgrammer.PeutAcheterLogistiqueMateriel)
                         return Results.Forbid();

                    if(nomMapGroupe == "boutique")
                         return await next(context);
               }
               
               else if (!droit.PeutLire || !droit.PeutEcrire)
                    return Results.Forbid();
          }
          else if(verbeHttp == HttpMethods.Delete)
          {
               if (!droit.PeutLire || !droit.PeutSupprimer)
                    return Results.Forbid();
          }

          return await next(context);
     }
}
