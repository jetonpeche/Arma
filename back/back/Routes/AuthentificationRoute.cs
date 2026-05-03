using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
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

          builder.MapPost("inscription", InscriptionAsync);

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
               PeutModifierBanque = infoLogin.DroitGroupe.PeutModifierBanque,
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

     async static Task<IResult> InscriptionAsync(
          [FromServices] IMemoryCache _cache,
          [FromServices] IMdpService _mdpServ,
          [FromServices] IJwtService _jwtServ,
          [FromBody] InscriptionRequete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var personnageCol = db.GetCollection<Personnage>();

          if (personnageCol.Exists(x => x.Login == _requete.Login))
               return Results.BadRequest("Le login existe déjà");

          var specialite = db.GetCollection<Specialite>().Query()
               .Where(x => x.Id == _requete.IdSpecialite)
               .Select(x => new { x.Id, x.EstNavy })
               .FirstOrDefault();

          if (specialite is null)
               return Results.BadRequest("Spécialité existe pas");

          var idPlaneteOrigine = db.GetCollection<PlaneteOrigine>().Query()
               .Where(x => x.Id == _requete.IdPlaneteOrigine)
               .Select(x => x.Id)
               .FirstOrDefault();

          if (idPlaneteOrigine is 0)
               return Results.BadRequest("Planete existe pas");

          var idGrade = db.GetCollection<Grade>().Query()
               .OrderBy(x => x.Ordre)
               .Where(x => x.Conserne == (specialite.EstNavy ?  1 : 2))
               .Select(x => x.Id)
               .FirstOrDefault();

          var personnage = new Personnage
          {
               DateNaissance = _requete.DateNaissance.XSS(),
               EtatService = _requete.EtatService?.XSS(),
               Grade = new Grade { Id = idGrade },
               Login = _requete.Login,
               Matricule = _requete.Matricule.XSS(),
               Mdp = _mdpServ.Hasher(_requete.Mdp),
               Nom = _requete.Nom.XSS(),
               NomDiscord = _requete.NomDiscord.XSS(),
               PlaneteOrigine = new PlaneteOrigine { Id = idPlaneteOrigine },
               Specialite = new Specialite { Id = specialite.Id },
               DateDerniereParticipation = null,
               DateCreation = DateTime.Now,
               GroupeSanguin = _requete.GroupeSanguin.XSS()
          };

          personnageCol.Insert(personnage);

          _cache.Remove("listePartiellePersonnage");

          return Results.NoContent();
     }
}
