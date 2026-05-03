
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
          string verbeHttp = context.HttpContext.Request.Method;

          if (nomMapGroupe is "authentification" or "test" or "bot-discord")
               return await next(context);

          if (verbeHttp == HttpMethods.Get)
          {
               if (nomMapGroupe is "specialite" or "grade" or "personnage")
                    return await next(context);
          }

          using var db = new LiteDatabase(Constant.BDD_NOM);

          int idPersonnage = context.HttpContext.RecupererIdPersonnage();

          var droitGroupe = db.GetCollection<Personnage>()
               .Query()
               .Include(x => x.DroitGroupe)
               .Where(x => x.Id == idPersonnage)
               .Select(x => x.DroitGroupe)
               .FirstOrDefault();

          if (droitGroupe is null)
               return Results.NotFound("Le personnage n'existe pas");

          var droit = droitGroupe.ListeDroit.FirstOrDefault(x => x.RouteGroupe == nomMapGroupe);

          if (nomMapGroupe is not "banque")
               if(droit is null)
                    return Results.Forbid();

          if(verbeHttp == HttpMethods.Get)
          {
               if(nomMapGroupe is "boutique")
                    return await next(context);

               if (!droit.PeutLire)
                    return Results.Forbid();
          }
          else if(verbeHttp == HttpMethods.Post || verbeHttp == HttpMethods.Put)
          {
               if(nomMapGroupe == "proposition-achat" && routeSplit.Length > 3 && routeSplit[3] == "ajouter")
               {
                    if(!droitGroupe.PeutProposerLogistiqueMateriel)
                         return Results.Forbid();

                    return await next(context);
               }

               // regles pour les achats de vaisseau, boutique ou de materiel en direct
               if (nomMapGroupe is "vaisseau" or "proposition-achat" or "boutique" && routeSplit.Length > 3 && routeSplit[3] == "acheter")
               {
                    if(nomMapGroupe == "vaisseau" && !droitGroupe.PeutAcheterVaisseau)
                         return Results.Forbid();

                    if(nomMapGroupe == "proposition-achat" && !droitGroupe.PeutAcheterLogistiqueMateriel)
                         return Results.Forbid();

                    if(nomMapGroupe == "boutique")
                         return await next(context);
               }

               if (nomMapGroupe is "banque")
               {
                    if(!droitGroupe.PeutModifierBanque)
                         return Results.Forbid();
               }
               
               if(droit is not null)
                    if (!droit.PeutLire || !droit.PeutEcrire)
                         return Results.Forbid();
          }
          else if(verbeHttp == HttpMethods.Delete)
          {
               if (!droit!.PeutLire || !droit.PeutSupprimer)
                    return Results.Forbid();
          }

          return await next(context);
     }
}
