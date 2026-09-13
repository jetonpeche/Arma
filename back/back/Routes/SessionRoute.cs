using back.Extensions;
using back.Models;
using back.ModelsImport.BatailleSpatials;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class SessionRoute
{
    public static RouteGroupBuilder AjouterRouteSession(this RouteGroupBuilder builder)
    {
          builder.MapPost("initialiser", CreerAsync)
               .WithDescription("Ajouter une nouvelle session")
               .ProducesCreated<int>();

          builder.MapPost("ajouter-pion/{idSession:int}", AjouterPionAsync)
               .WithDescription("Ajouter ou modifier un pion dans la session")
               .ProducesBadRequest()
               .ProducesNotFound()
               .Produces<string>();

          builder.MapPost("upload-fond", UploadAsync)
               .WithDescription("Ajouter ou modifier l'image de font d'une session")
               .ProducesBadRequest()
               .ProducesNotFound()
               .Produces<string>();

          builder.MapPost("upload-decor", UploadDecorAsync)
               .WithDescription("Ajouter ou modifier l'image de font d'une session")
               .ProducesBadRequest()
               .ProducesNotFound()
               .Produces<string>();

          builder.MapPut("modifier-decor-transform", ModifierDecorTransformAsync)
               .WithDescription("Met à jour position, échelle, rotation d'un décor existant")
               .ProducesNotFound()
               .ProducesNoContent();

          builder.MapDelete("supprimer-fond/{idSession:int}", SupprimerFondAsync)
               .WithDescription("Supprime l'image de fond")
               .ProducesNotFound()
               .ProducesNoContent();

          builder.MapDelete("supprimer-decor/{idSession:int}/{idDecor:guid}", SupprimerDecorAsync)
               .WithDescription("Supprime un décor")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
    }

     static async Task<IResult> CreerAsync(
          [FromBody] CreerSessionRequete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var session = new CombatSession
          {
               NomPartie = _requete.Nom.XSS(),
               NomImageCarte = "",
               Hauteur = 0,
               Largeur = 0
          };

          db.GetCollection<CombatSession>().Insert(session);

          return Results.Created("", session.Id);
     }

     static async Task<IResult> AjouterPionAsync(
          [FromRoute(Name = "idSession")] int _idSession,
          [FromBody] PionRequete _requete
     )
     {
          if (_idSession <= 0)
               return Results.NotFound("La session existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var session = db.GetCollection<CombatSession>().FindById(_idSession);

          if(session is null)
               return Results.NotFound("La session existe pas");

          var pion = new PionVaisseauCombat
          {
               IdPion = Guid.NewGuid(),
               IdVaisseau = _requete.IdVaisseau,
               PositionX = _requete.PositionX,
               PositionY  = _requete.PositionY,
               RotationDegres = _requete.RotationDegres,
               EstVaisseauPosseder = _requete.Appartenance == Enums.EPionAjout.Posseder,
               IdUtilisateurAutoriser = [],
               RevelationType = Enums.ETypeRevelation.Complet,
               VisibiliteMode = _requete.Visibilite is 0 ? Enums.EModeVisibilite.Tous : Enums.EModeVisibilite.MjUniquement
          };

          if(_requete.Appartenance is Enums.EPionAjout.Pnj)
          {
               if (!db.GetCollection<Vaisseau>().Exists(x => x.Id == _requete.IdVaisseau))
                    return Results.NotFound("Le vaisseau existe pas");

               var vaisseauPosseder = new VaisseauPosseder
               {
                    EstEpave = false,
                    EstPnj = true,
                    Vaisseau = new Vaisseau { Id = _requete.IdVaisseau },
                    NomCommandant = _requete.NomCommandant?.XSS(),
                    NomVaisseau = _requete.NomVaisseau?.XSS(),
                    NombreVaisseauDetruit = 0,
                    NombreBataillesSurvecue = 0
               };

               pion.IdVaisseau = vaisseauPosseder.Id;

               db.GetCollection<VaisseauPosseder>().Insert(vaisseauPosseder);
               session.ListeVaisseauSurCarte.Add(pion);
          }

          db.GetCollection<CombatSession>().Update(session);

          return Results.Created("", new { pion.IdPion, pion.IdVaisseau });
     }

     static async Task<IResult> UploadAsync(
          HttpContext _httpContext,
          [FromForm] SessionFichierFondRequete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var session = db.GetCollection<CombatSession>().FindById(_requete.IdSession);

          if (session is null)
               return Results.NotFound("La session existe pas");

          var resultat = _requete.Fichier.Verifier(1_000_000, []);

          if (resultat is not EReponseVerifFichier.Ok)
          {
               return Results.BadRequest(resultat switch
               {
                    EReponseVerifFichier.FormatPasAccepter => "Le format est interdit",
                    EReponseVerifFichier.FichierVide => "Le fichier est vide",
                    EReponseVerifFichier.FichierNull => "Le fichier n'existe pas",
                    EReponseVerifFichier.FichierTropCourt => "Erreur fichier",
                    EReponseVerifFichier.SvgDangereux => "Svg dangereux suspecté",
                    _ => "Erreur fichier"
               });
          }

          session.Largeur = _requete.Largeur;
          session.Hauteur = _requete.Hauteur;

          string? nouveauNomFichier = null;
          if (string.IsNullOrWhiteSpace(session.NomImageCarte))
          {
               nouveauNomFichier = $"{Guid.NewGuid()}{Path.GetExtension(_requete.Fichier.FileName)}";
               session.NomImageCarte = nouveauNomFichier;
               db.GetCollection<CombatSession>().Update(session);
          }
          else
          {
               nouveauNomFichier = session.NomImageCarte;
          }

          var baseUrl = Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE, session.Id.ToString());

          if (!Directory.Exists(baseUrl))
               Directory.CreateDirectory(baseUrl);

          using var stream = File.Create(Path.Combine(baseUrl, nouveauNomFichier));
          await _requete.Fichier.CopyToAsync(stream);

          return Results.Ok(ConstruireUrlFichier(_httpContext, _requete.IdSession, nouveauNomFichier));
     }

     static async Task<IResult> UploadDecorAsync(
          HttpContext _httpContext,
          [FromForm] SessionFichierDecorRequete _requete
     )
     {
          if (_requete.IdSession <= 0)
               return Results.NotFound("La session existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var session = db.GetCollection<CombatSession>().FindById(_requete.IdSession);

          if (session is null)
               return Results.NotFound("La session existe pas");

          var resultat = _requete.Fichier.Verifier(1_000_000, []);

          if (resultat is not EReponseVerifFichier.Ok)
          {
               return Results.BadRequest(resultat switch
               {
                    EReponseVerifFichier.FormatPasAccepter => "Le format est interdit",
                    EReponseVerifFichier.FichierVide => "Le fichier est vide",
                    EReponseVerifFichier.FichierNull => "Le fichier n'existe pas",
                    EReponseVerifFichier.FichierTropCourt => "Erreur fichier",
                    EReponseVerifFichier.SvgDangereux => "Svg dangereux suspecté",
                    _ => "Erreur fichier"
               });
          }

          string? nouveauNomFichier = null;
          var baseUrl = Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE, session.Id.ToString());

          if (!Directory.Exists(baseUrl))
               Directory.CreateDirectory(baseUrl);

          if (_requete.IdDecor.HasValue)
          {
               var decor = session.ListeDecorSurCarte.FirstOrDefault(x => x.IdDecor == _requete.IdDecor.Value);

               if (decor is null)
                    return Results.NotFound("Le decor existe pas");

               decor.PositionX = _requete.PositionX;
               decor.PositionY = _requete.PositionY;
               decor.RotationDegres = _requete.RotationDegres;
               decor.Echelle = _requete.Echelle;
               decor.OrdreCalque = _requete.OrdreCalque;
               decor.VisibiliteMode = _requete.VisibiliteMode is 0 ? Enums.EModeVisibilite.Tous : Enums.EModeVisibilite.MjUniquement;

               if (string.IsNullOrWhiteSpace(decor.NomImage))
               {
                    nouveauNomFichier = $"{Guid.NewGuid()}{Path.GetExtension(_requete.Fichier.FileName)}";
                    decor.NomImage = nouveauNomFichier;
               }
               else
               {
                    nouveauNomFichier = decor.NomImage;
               }
          }
          else
          {
               nouveauNomFichier = $"{Guid.NewGuid()}{Path.GetExtension(_requete.Fichier.FileName)}";
               var decor = new ElementDecorCombat
               {
                    IdDecor = Guid.NewGuid(),
                    Echelle = _requete.Echelle,
                    PositionX = _requete.PositionX,
                    PositionY = _requete.PositionY,
                    OrdreCalque = _requete.OrdreCalque,
                    RotationDegres = _requete.RotationDegres,
                    VisibiliteMode = _requete.VisibiliteMode is 0 ? Enums.EModeVisibilite.Tous : Enums.EModeVisibilite.MjUniquement,
                    NomImage = nouveauNomFichier
               };

               session.ListeDecorSurCarte.Add(decor);
          }

          db.GetCollection<CombatSession>().Update(session);
          using var stream = File.Create(Path.Combine(baseUrl, nouveauNomFichier));
          await _requete.Fichier.CopyToAsync(stream);
          
          return Results.Ok(ConstruireUrlFichier(_httpContext, _requete.IdSession, nouveauNomFichier));
     }

     static async Task<IResult> ModifierDecorTransformAsync(
          [FromBody] ModifierDecorTransformRequete _requete
     )
     {
          if (_requete.IdSession <= 0)
               return Results.NotFound("La session existe pas");

          if (_requete.IdDecor == Guid.Empty)
               return Results.NotFound("Le decor existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);
          var session = db.GetCollection<CombatSession>().FindById(_requete.IdSession);

          if (session is null) 
               return Results.NotFound("La session existe pas");

          var decor = session.ListeDecorSurCarte.FirstOrDefault(x => x.IdDecor == _requete.IdDecor);
          if (decor is null) 
               return Results.NotFound("Le decor existe pas");

          decor.PositionX = _requete.PositionX;
          decor.PositionY = _requete.PositionY;
          decor.RotationDegres = _requete.RotationDegres;
          decor.Echelle = _requete.Echelle;
          decor.OrdreCalque = _requete.OrdreCalque;
          decor.VisibiliteMode = _requete.VisibiliteMode == 0 ? Enums.EModeVisibilite.Tous : Enums.EModeVisibilite.MjUniquement;

          db.GetCollection<CombatSession>().Update(session);
          return Results.NoContent();
     }

     static async Task<IResult> SupprimerFondAsync(
          [FromRoute(Name = "idSession")] int _idSession
     )
     {
          if (_idSession <= 0)
               return Results.NotFound("La session existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var nomFichier = db.GetCollection<CombatSession>().Query()
               .Where(x => x.Id == _idSession)
               .Select(x => x.NomImageCarte)
               .FirstOrDefault();

          if (string.IsNullOrWhiteSpace(nomFichier))
               return Results.NoContent();

          File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE, _idSession.ToString(), nomFichier));

          db.GetCollection<CombatSession>().UpdateMany(_ => new CombatSession
          {
               NomImageCarte = ""
          },
          x => x.Id == _idSession);

          return Results.NoContent();
     }

     static async Task<IResult> SupprimerDecorAsync(
          [FromRoute(Name = "idSession")] int _idSession,
          [FromRoute(Name = "idDecor")] Guid _idDecor
     )
     {
          if (_idSession <= 0)
               return Results.NotFound("La session existe pas");

          if (_idDecor == Guid.Empty)
               return Results.NotFound("Le decor dans la session existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var session = db.GetCollection<CombatSession>().Query()
               .Where(x => x.Id == _idSession)
               .FirstOrDefault();

          if(session is null)
               return Results.NotFound("La session existe pas");

          var decor = session.ListeDecorSurCarte.FirstOrDefault(x => x.IdDecor == _idDecor);

          if(decor is null)
               return Results.NotFound("Le decor dans la session existe pas");

          File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE, _idSession.ToString(), decor.NomImage));
          session.ListeDecorSurCarte.RemoveAll(x => x.IdDecor == _idDecor);

          db.GetCollection<CombatSession>().Update(session);

          return Results.NoContent();
     }

     static string ConstruireUrlFichier(HttpContext _httpContext, int _idSession, string _nomFichier)
       => $"{_httpContext.Request.Scheme}://{_httpContext.Request.Host.Value}{_httpContext.Request.PathBase.Value}{Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE}{_idSession}/{_nomFichier}";
}
