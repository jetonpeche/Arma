using back.Extensions;
using back.Models;
using back.ModelsImport.botDiscord;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Text.RegularExpressions;
using PartiellePersonnage = (int Id, string Nom, string NomDiscord);

namespace back.Routes;

public static class BotDiscordRoute
{
     public static RouteGroupBuilder AjouterRouteBotDiscord(this RouteGroupBuilder builder)
     {
          builder.MapPost("voter", VoterAsync)
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     static async Task<IResult> VoterAsync(
          [FromServices] IMemoryCache _cache,
          [FromBody] VoterRequete _requete
     )
     {
          if(string.IsNullOrWhiteSpace(_requete.PersonnageRechercher) || _requete.PersonnageRechercher == "Un joueur")
               return Results.NotFound();

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = _requete.PersonnageRechercher.Split(" ", StringSplitOptions.RemoveEmptyEntries)
               .Where(x => x.Length > 2)
               .Select(Regex.Escape)
               .ToArray();

          if (liste.Count() == 0)
               return Results.NotFound();

          var regex = new Regex($"({string.Join('|', liste)})", RegexOptions.IgnoreCase);

          PartiellePersonnage[] listePartiellePersonnage = [];
          var personnageCol = db.GetCollection<Personnage>();

          if (_cache.TryGetValue("listePartiellePersonnage", out PartiellePersonnage[]? listeCache))
               listePartiellePersonnage = listeCache!;
          
          else
          {
               listePartiellePersonnage = personnageCol.Query()
                    .Select(x => new { x.Id, x.Nom, x.NomDiscord })
                    .ToEnumerable()
                    .Select(x => new PartiellePersonnage(x.Id, x.Nom, x.NomDiscord))
                    .ToArray();

               _cache.Set("listePartiellePersonnage", listePartiellePersonnage, TimeSpan.FromMinutes(5));
          }

          var personnage = listePartiellePersonnage
               .Where(x => regex.IsMatch(x.Nom))
               .FirstOrDefault();

          if (personnage == default)
          {
               personnage = listePartiellePersonnage
                    .Where(x => regex.IsMatch(x.NomDiscord))
                    .FirstOrDefault();

               if (personnage == default)
                    return Results.NotFound();
          }

          // au 10e vote ajoute 1 point boutique et met à 0 le nombre de vote
          personnageCol.UpdateMany(
               x => new Personnage
               { 
                    NbPointBoutique = x.NbVote == 9 ? x.NbPointBoutique + 1 : x.NbPointBoutique,
                    NbVote = x.NbVote == 9 ? 0 : x.NbVote + 1,
               }, 
               x => x.Id == personnage.Id
          );

          return Results.NoContent();
     }
}
