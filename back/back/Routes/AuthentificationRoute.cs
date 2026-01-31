using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Services.Jwts;
using Services.Mdp;
using System.Security.Claims;

namespace back.Routes;

public static class AuthentificationRoute
{
     public static RouteGroupBuilder AjouterRouteAuthentification(this RouteGroupBuilder builder)
     {
          builder.MapPost("connexion", ConnexionAsync)
               .WithDescription("Connexion au compte du personnage")
               .ProducesBadRequest()
               .ProducesNotFound()
               .Produces<ConnexionReponse>();

          return builder;
     }

     async static Task<IResult> ConnexionAsync(
          [FromServices] IMdpService _mdpServ,
          [FromServices] IJwtService _jwtServ,
          [FromBody] ConnexionRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Login))
               return Results.BadRequest("Login ne peut pas être vide");

          if (string.IsNullOrWhiteSpace(_requete.Mdp))
               return Results.BadRequest("Le mot de passe ne peut pas être vide");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var infoLogin = db.GetCollection<Personnage>()
               .Query()
               .Include(x => x.DroitGroupe)
               .Where(x => x.Login == _requete.Login)
               .Select(x => new
               {
                    x.Id,
                    x.Login,
                    x.Mdp,
                    x.NbPointBoutique,
                    x.Nom,
                    x.DroitGroupe
               })
               .FirstOrDefault();

          if(infoLogin is null || !_mdpServ.VerifierHash(_requete.Mdp, infoLogin.Mdp))
               return Results.NotFound("Le login ou le mot de passe est incorrect");

          string jwt = _jwtServ.Generer([
               new Claim("id", infoLogin.Id.ToString())
          ]);

          int nbPointBanque = db.GetCollection<Banque>().Query().First().Argent;

          if (infoLogin.DroitGroupe is null)
               return Results.BadRequest("Vous n'avez aucun droit, contacter un administrateur");

          var droitGroupe = new DroitGroupeReponse
          { 
               Id = infoLogin.DroitGroupe!.Id,
               Nom = infoLogin.DroitGroupe.Nom,
               PeutProposerLogistiqueMateriel = infoLogin.DroitGroupe.PeutProposerLogistiqueMateriel,
               PeutAcheterLogistiqueMateriel = infoLogin.DroitGroupe.PeutAcheterLogistiqueMateriel,
               PeutAcheterVaisseau = infoLogin.DroitGroupe.PeutAcheterVaisseau,
               ListeDroit = infoLogin.DroitGroupe.ListeDroit.ToArray()
          };

          var retour = new ConnexionReponse
          {
               Jwt = jwt,
               Nom = infoLogin.Nom,
               NbPointBoutique = infoLogin.NbPointBoutique,
               NbPointBanque = nbPointBanque,
               Droit = droitGroupe
          };

          return Results.Extensions.Ok(retour, ConnexionReponseContext.Default);
     }
}
