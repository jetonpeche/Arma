using back.Extensions;
using back.Models;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class BanqueRoute
{
     public static RouteGroupBuilder AjouterRouteBanque(this RouteGroupBuilder builder)
     {
          builder.MapPut("modifier", ModifierAsync)
               .WithDescription("Modifier les points de campagne")
               .ProducesBadRequest()
               .ProducesNoContent();

          return builder;
     }

     async static Task<IResult> ModifierAsync(
          HttpContext _httpContext,
          [FromBody] BanqueRequete _requete
     )
     {
          if (_requete.Mode is not 0 and not 1)
               return Results.BadRequest("Le mode n'existe pas");

          if (_requete.NbPoint <= 0)
               return Results.BadRequest("Le nombre de points doit être superieur à zéro");

          using var db = new LiteDatabase(Constant.BDD_NOM);
          var banque = db.GetCollection<Banque>().Query().First();

          if (_requete.Mode is 0)
               banque.Argent += _requete.NbPoint;

          else
          {
               banque.Argent -= _requete.NbPoint;

               if(banque.Argent < 0)
                    banque.Argent = 0;
          }

          var nomPersonnage = db.GetCollection<Personnage>().Query()
               .Where(x => x.Id == _httpContext.RecupererIdPersonnage())
               .Select(x => x.Nom)
               .First();

          db.GetCollection<Banque>().Update(banque);
          db.GetCollection<Historique>().Insert(new Historique
          {
               Date = DateTime.UtcNow,
               Information = $"{nomPersonnage} a {(_requete.Mode is 0 ? "ajouté(e)" : "retiré(e)")} {_requete.NbPoint} points de campagne"
          });

          return Results.NoContent();
     }
}
