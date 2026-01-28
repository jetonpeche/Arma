using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Services.Mdp;

namespace back.Routes;

public static class PersonnageRoute
{
    public static RouteGroupBuilder AjouterRoutePersonnage(this RouteGroupBuilder builder)
    {
          builder.MapGet("lister", (Delegate)ListerAsync)
               .WithDescription("Lister les personnages")
               .Produces<PersonnageReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouveau personnage")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPut("modifier/{idPersonnage:int}", ModifierAsync)
               .WithDescription("Modifier un personnage")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idPersonnage:int}", SupprimerAsync)
               .WithDescription("Supprimer un personnage")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
    }

    static async Task<IResult> ListerAsync(
        HttpContext _httpContext
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<Personnage>().Query()
            .Include(x => x.Grade)
            .Include(x => x.Specialite)
            .Include(x => x.PlaneteOrigine)
            .Select(x => new PersonnageReponse
            {
                Id = x.Id,
                EstFormateur = x.EstFormateur,
                EstFormateurSpecialite = x.EstFormateurSpecialite,
                FormationFaite = x.FormationFaite,
                GroupeSanguin = x.GroupeSanguin,
                Matricule = x.Matricule,
                NbBootcamp = x.NbBootcamp,
                NbOperation = x.NbOperation,
                Nom = x.Nom,
                NbPointBoutique = x.NbPointBoutique,
                NomDiscord = x.NomDiscord,
                EtatService = x.EtatService,
                DateCreation = x.DateCreation.ToString("yyyy-MM-dd"),
                DateDerniereParticipation = x.DateDerniereParticipation.HasValue ? x.DateDerniereParticipation.Value.ToString("yyyy-MM-dd") : null,
                Grade = x.Grade != null ? new GradeLegerReponse
                {
                    Id = x.Grade.Id,
                    Nom = x.Grade.Nom
                } : null,
                PlaneteOrigine = x.PlaneteOrigine != null ? new PlaneteOrigineLegerReponse
                { 
                    Id = x.PlaneteOrigine.Id,
                    Nom = x.PlaneteOrigine.Nom
                } : null,
                Specialite = x.Specialite != null ? new SpecialiteLegerReponse
                {
                    Id = x.Specialite.Id,
                    Nom = x.Specialite.Nom
                } : null,
                UrlPhotoIdentite = x.NomFichierPhotoIdentite != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_PERSONNAGE + x.NomFichierPhotoIdentite : "",

            })
            .ToArray();

        return Results.Extensions.Ok(liste, PersonnageReponseContext.Default);
    }

    static async Task<IResult> AjouterAsync(
         [FromServices] IMdpService _mdpServ,
        [FromBody] PersonnageRequete _requete
    )
    {
          if (_requete.NbPointBoutique < 0)
               return Results.BadRequest("Le nombre de point boutique ne peut pas être négatif");

          if (string.IsNullOrWhiteSpace(_requete.Login))
               return Results.BadRequest("Le login ne peut pas être vide");

          if (string.IsNullOrWhiteSpace(_requete.Mdp))
               return Results.BadRequest("Le login ne peut pas être vide");

          if (_requete.Mdp.Length < 8)
               return Results.BadRequest("Le mot de passe doit contenir au moins 8 caractères");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var personnageCol = db.GetCollection<Personnage>();

          if (personnageCol.Exists(x => x.Login == _requete.Login))
               return Results.BadRequest("Le login existe déjà");

          if (!db.GetCollection<DroitGroupe>().Exists(x => x.Id == _requete.IdDroitGroupe))
               return Results.NotFound("Le droit programmé n'existe pas");

          string mdpHash = _mdpServ.Hasher(_requete.Mdp);

          var personnage = new Personnage
          {
               Login = _requete.Login,
               Mdp = mdpHash,
               Matricule = _requete.Matricule.XSS(),
               Nom = _requete.Nom.XSS(),
               NomDiscord = _requete.NomDiscord.XSS(),
               EtatService = _requete.EtatService?.XSS(),
               GroupeSanguin = _requete.GroupeSanguin.XSS(),
               NbPointBoutique = _requete.NbPointBoutique,
               DateCreation = DateTime.Now,
               DroitGroupe = new DroitGroupe { Id = _requete.IdDroitGroupe}
          };

          if(_requete.FormationFaite)
          {
               personnage.FormationFaite = true;
               personnage.NbBootcamp += 1;
               personnage.DateDerniereParticipation = DateTime.Now;
          }

          if (_requete.IdSpecialite is not null)
               personnage.Specialite = db.GetCollection<Specialite>().FindById(_requete.IdSpecialite);

          personnage.Grade = db.GetCollection<Grade>().FindById(_requete.IdGrade);
          personnage.PlaneteOrigine = db.GetCollection<PlaneteOrigine>().FindById(_requete.IdPlaneteOrigine);

          var id = personnageCol.Insert(personnage).AsInt32;

          return Results.Created("", id);
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idPersonnage")] int _idPersonnage,
        [FromBody] PersonnageModifierRequete _requete
    )
    {
          if (_requete.NbPointBoutique < 0)
               return Results.BadRequest("Le nombre de point boutique ne peut pas être négatif");

          if(_requete.IdDroitGroupe <= 0)
               return Results.NotFound("Le droit programmé n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var col = db.GetCollection<Personnage>();

          var personnageBdd = col.FindById(_idPersonnage);

          if (personnageBdd is null)
               return Results.NotFound("Le personnage n'existe pas");

          var personnage = new Personnage
          {
               Id = _idPersonnage,
               Matricule = _requete.Matricule.XSS(),
               Nom = _requete.Nom.XSS(),
               NomDiscord = _requete.Nom.XSS(),
               EtatService = _requete.EtatService?.XSS(),
               GroupeSanguin = _requete.GroupeSanguin.XSS(),
               NbBootcamp = _requete.NbBootcamp,
               NbOperation = _requete.NbOperation,
               EstFormateur = _requete.EstFormateur,
               EstFormateurSpecialite = _requete.EstFormateurSpecialite,
               FormationFaite = _requete.FormationFaite,
               NbPointBoutique = _requete.NbPointBoutique,
               DateDerniereParticipation = personnageBdd.DateDerniereParticipation,
               NomFichierPhotoIdentite = personnageBdd.NomFichierPhotoIdentite
          };

          if (personnageBdd.DroitGroupe?.Id != _requete.IdDroitGroupe)
          {
               if (!db.GetCollection<DroitGroupe>().Exists(x => x.Id == _requete.IdDroitGroupe))
                    return Results.NotFound("Le droit programmé n'existe pas");

               personnage.DroitGroupe = new DroitGroupe { Id = _requete.IdDroitGroupe };
          }

          personnage.Grade = db.GetCollection<Grade>().FindById(_requete.IdGrade);
          personnage.PlaneteOrigine = db.GetCollection<PlaneteOrigine>().FindById(_requete.IdPlaneteOrigine);

          if (_requete.IdSpecialite is not null)
               personnage.Specialite = db.GetCollection<Specialite>().FindById(_requete.IdSpecialite);

          if (_requete.NbBootcamp > personnageBdd.NbBootcamp || _requete.NbOperation > personnageBdd.NbOperation)
               personnage.DateDerniereParticipation = DateTime.UtcNow;

          var ok = col.Update(personnage);

          return ok ? Results.NoContent() : Results.NotFound();
    }

    static async Task<IResult> SupprimerAsync(
        [FromRoute(Name = "idPersonnage")] int _idPersonnage
    )
    {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var col = db.GetCollection<Personnage>();
          var personnage = col.FindById(_idPersonnage);

          if (personnage is null)
               return Results.NotFound("Le personnage n'existe pas");

          if (personnage.PersonnageSecondaire is not null)
               db.GetCollection<PersonnageSecondaire>().Delete(personnage.PersonnageSecondaire.Id);

          var listeBoutiquePrix = db.GetCollection<BoutiquePrix>()
               .Query()
               .Where(x => x.ListePersonnage.Select(y => y.Id).Any(y => y == _idPersonnage))
               .ToArray();

          foreach (var element in listeBoutiquePrix)
               element.ListePersonnage.RemoveAll(x => x.Id == _idPersonnage);

          db.GetCollection<BoutiquePrix>().Update(listeBoutiquePrix);
          col.Delete(_idPersonnage);

          return Results.NoContent();
    }
}
