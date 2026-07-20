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

          builder.MapGet("lister-mort", ListerMortAsync)
               .WithDescription("Lister les personnages morts")
               .Produces<PersonnageMortReponse[]>();

        builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouveau personnage")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPost("ajouter-mort", AjouterMortAsync)
               .WithDescription("Ajouter un nouveau personnage mort")
               .ProducesNotFound()
               .ProducesCreated();

        builder.MapPut("declarer-mort/{idPersonnage:int}", MortAsync)
               .WithDescription("Déclarer mort un personnage")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();

        builder.MapPut("modifier/{idPersonnage:int}", ModifierAsync)
               .WithDescription("Modifier un personnage")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapPut("modifier-mort/{idPersonnageMort:int}", ModifierMortAsync)
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

          builder.MapDelete("supprimer-mort/{idPersonnageMort:int}", SupprimerMortAsync)
               .WithDescription("Supprimer un personnage")
               .ProducesNotFound()
               .ProducesNoContent();

          builder.MapDelete("supprimer-medaille", SupprimerMedailleAsync)
               .WithDescription("Supprimer une medaille à un personnage")
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
               .Include(x => x.ListeMedaille.Select(y => y.Medaille))
               .Select(x => new PersonnageReponse
               {
                    Id = x.Id,
                    EstFormateur = x.EstFormateur,
                    EstFormateurSpecialite = x.EstFormateurSpecialite,
                    FormationFaite = x.FormationFaite,
                    EstValider = x.Valider,
                    GroupeSanguin = x.GroupeSanguin,
                    Matricule = x.Matricule,
                    NbBootcamp = x.NbBootcamp,
                    NbOperation = x.NbOperation,
                    Nom = x.Nom,
                    NbOperationGradeBloquer = x.NbOperationGradeBloquer,
                    NbPointBoutique = x.NbPointBoutique,
                    NomDiscord = x.NomDiscord,
                    EtatService = x.EtatService,
                    DateNaissance = x.DateNaissance,
                    EstNavy = x.Specialite != null ? x.Specialite.EstNavy : (x.Grade != null && x.Grade.Conserne == 1),

                   DateCreation = x.DateCreation.ToString("yyyy-MM-dd"),
                    DateDerniereParticipation = x.DateDerniereParticipation.HasValue ? x.DateDerniereParticipation.Value.ToString("yyyy-MM-dd") : null,
                    Grade = x.Grade != null ? new GradeLegerReponse
                    {
                         Id = x.Grade.Id,
                         Nom = x.Grade.Nom,
                         NomRaccourci = x.Grade.NomRaccourci
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
                    ListeMedaille = x.ListeMedaille.Select(y => new MedaillePersonnageReponse              
                    {
                         Id = y.Medaille.Id,
                         Nom = y.Medaille.Nom,
                         UrlImage = y.Medaille.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_MEDAILLE + y.Medaille.NomFichier : "",
                    }).ToArray(),
                   UrlPhotoIdentite = x.NomFichierPhotoIdentite != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_PERSONNAGE + x.NomFichierPhotoIdentite : "",
               })
               .ToArray();

        return Results.Extensions.Ok(liste, PersonnageReponseContext.Default);
    }

    static async Task<IResult> ListerMortAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var liste = db.GetCollection<PersonnageMort>().Query()
          .Select(x => new PersonnageMortReponse
          {
               Id = x.Id,
               DateMort = x.DateMort,
               DateNaissance = x.DateNaissance,
               ElogeFunebre = x.ElogeFunebre,
               NbOperation = x.NbOperation,
               Nom = x.Nom,
               NomGrade = x.NomGrade,
               NomSpecialite = x.NomSpecialite
          }).ToArray();

        return Results.Extensions.Ok(liste, PersonnageMortReponseContext.Default);
    }

    static async Task<IResult> AjouterAsync(
         [FromServices] IMemoryCache _cache,
         [FromServices] IMdpService _mdpServ,
        [FromBody] PersonnageRequete _requete
    )
    {
          if (_requete.NbPointBoutique < 0)
               return Results.BadRequest("Le nombre de point boutique ne peut pas être négatif");

          if(!string.IsNullOrWhiteSpace(_requete.Login))
          {
               if (string.IsNullOrWhiteSpace(_requete.Mdp))
                    return Results.BadRequest("Le login ne peut pas être vide");

               if (_requete.Mdp.Length < 8)
                    return Results.BadRequest("Le mot de passe doit contenir au moins 8 caractères");
          }

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var personnageCol = db.GetCollection<Personnage>();

          if (personnageCol.Exists(x => x.Login == _requete.Login))
               return Results.BadRequest("Le login existe déjà");

          string? mdpHash = _requete.Mdp is not null ? _mdpServ.Hasher(_requete.Mdp) : null;

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
               EstFormateur = _requete.EstFormateur,
               EstFormateurSpecialite = _requete.EstFormateurSpecialite,
               FormationFaite = _requete.FormationFaite,
               DroitGroupe = null
          };

          if(_requete.FormationFaite)
          {
               personnage.FormationFaite = true;
               personnage.NbBootcamp++;
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

    static async Task<IResult> AjouterMortAsync([FromBody] PersonnageMort2Requete _requete)
    {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var nomGrade = db.GetCollection<Grade>().Query().Where(x => x.Id == _requete.IdGrade).FirstOrDefault()?.Nom;

          if (nomGrade is null)
               return Results.NotFound("Le grade n'existe pas");

          var nomSpecialite = db.GetCollection<Specialite>().Query().Where(x => x.Id == _requete.IdSpecialite).FirstOrDefault()?.Nom;

          if (nomSpecialite is null)
               return Results.NotFound("La spécialité n'existe pas");

          db.GetCollection<PersonnageMort>().Insert(new PersonnageMort
          {
               DateMort = _requete.DateMort.XSS(),
               DateNaissance = _requete.DateNaissance.XSS(),
               ElogeFunebre = string.IsNullOrWhiteSpace(_requete.ElogeFunebre) ? null : _requete.ElogeFunebre.XSS(),
               NbOperation = _requete.NbOperation,
               Nom = _requete.Nom.XSS(),
               NomGrade = nomGrade,
               NomSpecialite = nomSpecialite
          });

          return Results.Created();
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
          personnageBdd.Valider = true;

          personnageBdd.Grade = db.GetCollection<Grade>().FindById(_requete.IdGrade);
          personnageBdd.PlaneteOrigine = db.GetCollection<PlaneteOrigine>().FindById(_requete.IdPlaneteOrigine);

          if (
               (personnageBdd.Nom != _requete.Nom) ||
               (personnageBdd.NomDiscord != _requete.NomDiscord)
          )
          {
               _cache.Remove("listePartiellePersonnage");
          }

          personnageBdd.Nom = _requete.Nom.XSS();
          personnageBdd.NomDiscord = _requete.NomDiscord.XSS();

          if (_requete.IdSpecialite is not null)
               personnageBdd.Specialite = db.GetCollection<Specialite>().FindById(_requete.IdSpecialite);

          if (_requete.NbBootcamp > personnageBdd.NbBootcamp || _requete.NbOperation > personnageBdd.NbOperation)
               personnageBdd.DateDerniereParticipation = DateTime.UtcNow;

          var ok = col.Update(personnageBdd);

          return ok ? Results.NoContent() : Results.NotFound();
    }

    static async Task<IResult> MortAsync(
          [FromRoute(Name = "idPersonnage")] int _idPersonnage,
          [FromBody] PersonnageMortRequete _requete
    )
    {
          if (_idPersonnage <= 0)
               return Results.NotFound("Le personnage n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var personnage = db.GetCollection<Personnage>()
          .Include(x => x.Grade)
          .Include(x => x.Specialite)
          .FindById(_idPersonnage);

        if (personnage is null)
            return Results.NotFound("Le personnage n'existe pas");

          var idPersonnageMort = db.GetCollection<PersonnageMort>().Insert(new PersonnageMort
          {
              Nom = personnage.Nom,
              NomSpecialite = personnage.Specialite?.Nom,
              NomGrade = personnage.Grade?.Nom,
              DateNaissance = personnage.DateNaissance,
              DateMort = _requete.DateMort.XSS(),
              NbOperation = personnage.NbOperation,
              ElogeFunebre = string.IsNullOrWhiteSpace(_requete.ElogeFunebre) ? null : _requete.ElogeFunebre.XSS()
          }).AsInt32;

        personnage.DateNaissance = _requete.DateNaissance.XSS();
        personnage.Nom = _requete.Nom.XSS();
        personnage.EstFormateur = _requete.EstFormateur;
        personnage.EstFormateurSpecialite = _requete.EstFormateurSpecialite;
        personnage.GroupeSanguin = _requete.GroupeSanguin.XSS();
        personnage.EtatService = string.IsNullOrWhiteSpace(personnage.EtatService) ? null : personnage.EtatService.XSS();
        personnage.IdGradeAvantMort = personnage.Grade?.Id;
        
        var planeteOrigine = db.GetCollection<PlaneteOrigine>().FindById(_requete.IdPlaneteOrigine);

        if (planeteOrigine is null)
          return Results.NotFound("La planete n'existe pas");

        personnage.PlaneteOrigine = new() { Id = _requete.IdPlaneteOrigine };

        var ordre = personnage.Grade?.Ordre ?? 1;
        var gradePrecedent = db.GetCollection<Grade>().Query()
          .Where(x => x.Ordre <= ordre)
          .OrderByDescending(x => x.Ordre)
          .Limit(2)
          .ToList();

        if (gradePrecedent is null || gradePrecedent.Count is 0)
        {
             db.GetCollection<PersonnageMort>().Delete(idPersonnageMort);
             return Results.BadRequest("Aucun grade trouvé");
        }

          personnage.Grade = new() { Id = gradePrecedent[^1].Id };
          personnage.NbOperationGradeBloquer = personnage.Specialite?.Id != _requete.IdSpecialite ? 5 : 1;

          db.GetCollection<Personnage>().Update(personnage);
          
        return Results.NoContent();
    }

     static async Task<IResult> ModifierMortAsync(
          [FromRoute(Name = "idPersonnageMort")] int _idPersonnageMort,
          [FromBody] PersonnageMort2Requete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var nomGrade = db.GetCollection<Grade>().Query().Where(x => x.Id == _requete.IdGrade).FirstOrDefault()?.Nom;

          if (nomGrade is null)
               return Results.NotFound("Le grade n'existe pas");

          var nomSpecialite = db.GetCollection<Specialite>().Query().Where(x => x.Id == _requete.IdSpecialite).FirstOrDefault()?.Nom;

          if (nomSpecialite is null)
               return Results.NotFound("La spécialité n'existe pas");

          var ok = db.GetCollection<PersonnageMort>().Update(new PersonnageMort
          {
               Id = _idPersonnageMort,
               DateMort = _requete.DateMort.XSS(),
               DateNaissance = _requete.DateNaissance.XSS(),
               ElogeFunebre = string.IsNullOrWhiteSpace(_requete.ElogeFunebre) ? null : _requete.ElogeFunebre.XSS(),
               NbOperation = _requete.NbOperation,
               Nom = _requete.Nom.XSS(),
               NomGrade = nomGrade,
               NomSpecialite = nomSpecialite
          });

          return ok ? Results.NoContent() : Results.NotFound("Le défund n'existe pas");
     }

    static async Task<IResult> ModifierPointAsync(
          HttpContext _httpContext,
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

          var listePersonnage = personnageCol.Query()
               .Include(x => x.Grade)
               .Where(predicatBuilder)
               .ToArray();

          if (listePersonnage.Length is 0)
               return Results.BadRequest("Aucun personnage");

          foreach (var element in listePersonnage)
          {
               element.DateDerniereParticipation = DateTime.UtcNow;
               element.NbOperation++;

               if (element.NbOperationGradeBloquer > 0)
               {
                    element.NbOperationGradeBloquer--;
               
                    if (element.NbOperationGradeBloquer is 0 && element.IdGradeAvantMort.HasValue)
                         element.Grade = new() { Id = element.IdGradeAvantMort.Value };

                    continue;
               }

               if(element.Grade is not null)
               {
                    element.NbPointBoutique += element.Grade.NbPointBoutiqueGagnerParOperation;

                    // passe si le grade actuel est un grade qui ne peut pas être atteind par le nombre d'opération requise
                    if (element.Grade.EstHonorifique || element.Grade.CandidatureRequise)
                         continue;
                    
                    var prochainGrade = listeGrade.FirstOrDefault(x => x.NbOperationRequis >= element.NbOperation && x.Conserne == element.Grade.Conserne);

                    if(prochainGrade is not null && prochainGrade.Id != element.Grade.Id)
                         element.Grade = prochainGrade;
               }
               else
                    element.NbPointBoutique++;
          }

          personnageCol.Update(listePersonnage);

          var nomAuteur = personnageCol.Query().Where(x => x.Id == _httpContext.RecupererIdPersonnage()).Select(x => x.Nom).First();

          db.GetCollection<HistoriqueRapportOperation>().Insert(new HistoriqueRapportOperation
          {
               ListePersonnage = [..listePersonnage.Select(x => x.Nom)],
               NomAuteur = nomAuteur,
               DateCreation = DateTime.UtcNow
          });

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

    static async Task<IResult> SupprimerMortAsync(
     [FromRoute(Name = "idPersonnageMort")] int _idPersonnageMort
    )
    {
        if (_idPersonnageMort <= 0)
            return Results.NotFound("La tombe n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var ok = db.GetCollection<PersonnageMort>().Delete(_idPersonnageMort);

        return ok ? Results.NoContent() : Results.NotFound("La tombe n'existe pas");
    }

     static async Task<IResult> SupprimerMedailleAsync(
          [FromBody] SupprimerMedaillePersonnageRequete _requete 
     )
     {
          if (_requete.IdMedaille <= 0 || _requete.IdPersonnage <= 0)
               return Results.NotFound("Médaille ou personnage n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var personnage = db.GetCollection<Personnage>().FindById(_requete.IdPersonnage);

          if (personnage is null)
               return Results.NotFound("Personnage n'existe pas");

          var nb = personnage.ListeMedaille.RemoveAll(x => x.Medaille.Id == _requete.IdMedaille);

          if (nb is 0)
               return Results.NoContent();

          var nbPointMedaille = db.GetCollection<Medaille>().Query().Where(x => x.Id == _requete.IdMedaille)
               .Select(x => x.NbPoint)
               .FirstOrDefault();

          personnage.NbPointBoutique -= nbPointMedaille;
          db.GetCollection<Personnage>().Update(personnage);

          return Results.NoContent();
     }

}
