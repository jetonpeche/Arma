using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
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

          builder.MapPatch("modifier-point", ModifierPointAsync)
               .WithDescription("Ajouter les points du grade aux personnages choisi")
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
                DateNaissance = x.DateNaissance,
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
         [FromServices] IMemoryCache _cache,
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
               DateNaissance = _requete.DateNaissance.XSS(),
               DateCreation = DateTime.Now,
               DroitGroupe = null
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

          _cache.Remove("listePartiellePersonnage");

          return Results.Created("", id);
    }

    static async Task<IResult> ModifierAsync(
        [FromServices] IMemoryCache _cache,
        [FromRoute(Name = "idPersonnage")] int _idPersonnage,
        [FromBody] PersonnageModifierRequete _requete
    )
    {
          if (_requete.NbPointBoutique < 0)
               return Results.BadRequest("Le nombre de point boutique ne peut pas être négatif");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var col = db.GetCollection<Personnage>();

          var personnageBdd = col.FindById(_idPersonnage);

          if (personnageBdd is null)
               return Results.NotFound("Le personnage n'existe pas");

          personnageBdd.Matricule = _requete.Matricule.XSS();
          personnageBdd.Nom = _requete.Nom.XSS();
          personnageBdd.NomDiscord = _requete.Nom.XSS();
          personnageBdd.EtatService = _requete.EtatService?.XSS();
          personnageBdd.GroupeSanguin = _requete.GroupeSanguin.XSS();
          personnageBdd.NbBootcamp = _requete.NbBootcamp;
          personnageBdd.NbOperation = _requete.NbOperation;
          personnageBdd.EstFormateur = _requete.EstFormateur;
          personnageBdd.EstFormateurSpecialite = _requete.EstFormateurSpecialite;
          personnageBdd.FormationFaite = _requete.FormationFaite;
          personnageBdd.NbPointBoutique = _requete.NbPointBoutique;
          personnageBdd.DateDerniereParticipation = personnageBdd.DateDerniereParticipation;
          personnageBdd.NomFichierPhotoIdentite = personnageBdd.NomFichierPhotoIdentite;
          personnageBdd.DateNaissance = _requete.DateNaissance.XSS();

          personnageBdd.Grade = db.GetCollection<Grade>().FindById(_requete.IdGrade);
          personnageBdd.PlaneteOrigine = db.GetCollection<PlaneteOrigine>().FindById(_requete.IdPlaneteOrigine);

          if (_requete.IdSpecialite is not null)
               personnageBdd.Specialite = db.GetCollection<Specialite>().FindById(_requete.IdSpecialite);

          if (_requete.NbBootcamp > personnageBdd.NbBootcamp || _requete.NbOperation > personnageBdd.NbOperation)
               personnageBdd.DateDerniereParticipation = DateTime.UtcNow;

          var ok = col.Update(personnageBdd);

          if(
               (personnageBdd.Nom != _requete.Nom) || 
               (personnageBdd.NomDiscord != _requete.NomDiscord)
          )
          {
               _cache.Remove("listePartiellePersonnage");
          }

          return ok ? Results.NoContent() : Results.NotFound();
    }

     static async Task<IResult> ModifierPointAsync(
          [FromServices] IMemoryCache _cache,
          [FromBody] int[] _listeIdPersonnage
     )
     {
          if (_listeIdPersonnage.Length is 0)
               return Results.BadRequest("Aucun personnage");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var personnageCol = db.GetCollection<Personnage>();

          var predicatBuilder = PredicateBuilder.True<Personnage>();

          for (int i = 0; i < _listeIdPersonnage.Length; i++)
               predicatBuilder.Or(x => x.Id == _listeIdPersonnage[i]);

          var listeGrade = db.GetCollection<Grade>().Query()
               .Where(x => x.NbOperationRequis > 0)
               .OrderBy(x => x.Ordre)
               .ToList();

          var gradeMaxPoint = listeGrade.MaxBy(x => x.NbOperationRequis);

          var listePersonnage = personnageCol.Query()
               .Include(x => x.Grade)
               .Where(predicatBuilder)
               .ToArray();

          foreach (var element in listePersonnage)
          {
               element.DateDerniereParticipation = DateTime.UtcNow;
               element.NbOperation++;

               if(element.Grade is not null)
               {
                    element.NbPointBoutique += element.Grade.NbPointBoutiqueGagnerParOperation;

                    var prochainGrade = listeGrade.FirstOrDefault(x => x.NbOperationRequis >= element.NbOperation && x.Conserne == element.Grade.Conserne);

                    if(prochainGrade is not null && prochainGrade.Id != element.Grade.Id)
                         element.Grade = prochainGrade;
               }
          }

          personnageCol.Update(listePersonnage);

          _cache.Remove("listePartiellePersonnage");

          return Results.NoContent();
     }

    static async Task<IResult> SupprimerAsync(
        [FromServices] IMemoryCache _cache,
        [FromRoute(Name = "idPersonnage")] int _idPersonnage
    )
    {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var col = db.GetCollection<Personnage>();
          var personnage = col.FindById(_idPersonnage);

          if (personnage is null)
               return Results.NotFound("Le personnage n'existe pas");

          if (personnage.NomFichierPhotoIdentite is not null)
               File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_PERSONNAGE + personnage.NomFichierPhotoIdentite));

          if (personnage.PersonnageSecondaire is not null)
          {
               var nomFichier = db.GetCollection<PersonnageSecondaire>().Query()
                    .Where(x => x.Id == personnage.PersonnageSecondaire.Id)
                    .Select(x => x.NomFichierPhotoIdentite)
                    .FirstOrDefault();

               if(nomFichier is not null)
                    File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_PERSONNAGE + nomFichier));

               db.GetCollection<PersonnageSecondaire>().Delete(personnage.PersonnageSecondaire.Id);
          }

          var listeBoutiquePrix = db.GetCollection<BoutiquePrix>()
               .Query()
               .Where(x => x.ListePersonnage.Select(y => y.Id).Any(y => y == _idPersonnage))
               .ToArray();

          foreach (var element in listeBoutiquePrix)
               element.ListePersonnage.RemoveAll(x => x.Id == _idPersonnage);

          db.GetCollection<BoutiquePrix>().Update(listeBoutiquePrix);
          col.Delete(_idPersonnage);

          _cache.Remove("listePartiellePersonnage");

          return Results.NoContent();
    }
}
