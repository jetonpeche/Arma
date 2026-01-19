using back.Enums;
using back.Extensions;
using back.Models;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class FichierRoute
{
     public static RouteGroupBuilder AjouterRouteFichier(this RouteGroupBuilder builder)
     {
          builder.MapPost("", UploadPhoto)
               .WithDescription("Uploader ou remplacer un fichier")
               .DisableAntiforgery()
               .ProducesBadRequest()
               .ProducesNoContent();

          return builder;
     }

     static async Task<IResult> UploadPhoto(
          HttpContext _httpContext,
          [FromForm] FichierRequete _requete
     )
     {
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

          var baseUrl = Path.Combine(Environment.CurrentDirectory, "Photos");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          switch (_requete.TypeRessource)
          {
               case ETypeRessource.Personnage:
                    var colPersonnage = db.GetCollection<Personnage>();

                    var personnage = colPersonnage.FindById(_requete.idRessource);

                    if (personnage is null)
                          return Results.NotFound();

                    string nomFichier = "";

                    if (personnage.NomFichierPhotoIdentite is null)
                    {
                         nomFichier = $"{Guid.NewGuid()}{Path.GetExtension(_requete.Fichier.FileName)}";
                         personnage.NomFichierPhotoIdentite = nomFichier;

                         colPersonnage.Update(personnage);
                    }
                    else
                         nomFichier = personnage.NomFichierPhotoIdentite;

                    await UploadAsync(_requete.Fichier, Constant.CHEMIN_IMG_PERSONNAGE, nomFichier);
                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_PERSONNAGE + nomFichier));
                
               case ETypeRessource.Grade:
                    var colGrade = db.GetCollection<Grade>();

                    var grade = colGrade.FindById(_requete.idRessource);

                    if (grade is null)
                         return Results.NotFound();

                    string nomFichierGrade = "";

                    if (grade.NomFichierIcone is null)
                    {
                         nomFichierGrade = $"{Guid.NewGuid()}{Path.GetExtension(_requete.Fichier.FileName)}";
                         grade.NomFichierIcone = nomFichierGrade;

                         colGrade.Update(grade);
                    }
                    else
                         nomFichierGrade = grade.NomFichierIcone;

                    await UploadAsync(_requete.Fichier, Constant.CHEMIN_IMG_GRADE, nomFichierGrade);
                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_GRADE + nomFichierGrade));

               case ETypeRessource.PersonnageSecondaire:
                    var colPersoSec = db.GetCollection<PersonnageSecondaire>();

                    var persoSec = colPersoSec.FindById(_requete.idRessource);

                    if (persoSec is null)
                         return Results.NotFound();

                    string nomFichierPersoSec = "";

                    if (persoSec.NomFichierPhotoIdentite is null)
                    {
                         nomFichierGrade = $"{Guid.NewGuid()}{Path.GetExtension(_requete.Fichier.FileName)}";
                         persoSec.NomFichierPhotoIdentite = nomFichierGrade;

                         colPersoSec.Update(persoSec);
                    }
                    else
                         nomFichierPersoSec = persoSec.NomFichierPhotoIdentite;

                    await UploadAsync(_requete.Fichier, Constant.CHEMIN_IMG_PERSONNAGE, nomFichierPersoSec);
                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_PERSONNAGE + nomFichierPersoSec));

               case ETypeRessource.Boutique:
                    var colBoutique = db.GetCollection<Boutique>();

                    var boutique = colBoutique.FindById(_requete.idRessource);

                    if (boutique is null)
                         return Results.NotFound();

                    string nomFichierBoutique = "";

                    if (boutique.NomFichier is null)
                    {
                         nomFichierBoutique = $"{Guid.NewGuid()}{Path.GetExtension(_requete.Fichier.FileName)}";
                         boutique.NomFichier = nomFichierBoutique;

                         colBoutique.Update(boutique);
                    }
                    else
                         nomFichierBoutique = boutique.NomFichier;

                    await UploadAsync(_requete.Fichier, Constant.CHEMIN_IMG_BOUTIQUE, nomFichierBoutique);
                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_BOUTIQUE + nomFichierBoutique));
          }

        return Results.BadRequest("Erreur type de ressource");
     }

     static async Task UploadAsync(IFormFile _fichier, string _cheminBase, string _nouveauNomFichier)
     {
          var baseUrl = Path.Join(Environment.CurrentDirectory,  _cheminBase);

          if (!Directory.Exists(baseUrl))
               Directory.CreateDirectory(baseUrl);

          using (MemoryStream memoryStream = new())
          {
               // recupere le fichier dans memoryStream
               await _fichier.CopyToAsync(memoryStream);

               memoryStream.Seek(0, SeekOrigin.Begin);

               File.WriteAllBytes(Path.Combine(baseUrl, _nouveauNomFichier), memoryStream.ToArray());
          }
     }

    static string ConstruireUrlFichier(HttpContext _httpContext, string _nomFichier)
        => $"{_httpContext.Request.Scheme}://{_httpContext.Request.Host.Value}{_httpContext.Request.PathBase.Value}{_nomFichier}";
}
