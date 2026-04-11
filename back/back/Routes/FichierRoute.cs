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

          switch (_requete.TypeRessource)
          {
               case ETypeRessource.Personnage:
                    var nouveauNomFichierPerso = await UploadAsync<Personnage>(
                          _requete.idRessource,
                          _requete.Fichier,
                          Constant.CHEMIN_IMG_PERSONNAGE,
                          (x) => x.NomFichierPhotoIdentite,
                          (x, s) => x.NomFichierPhotoIdentite = s
                    );

                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_PERSONNAGE + nouveauNomFichierPerso));
                
               case ETypeRessource.Grade:
                    var nouveauNomFichierGrade = await UploadAsync<Grade>(
                          _requete.idRessource,
                          _requete.Fichier,
                          Constant.CHEMIN_IMG_GRADE,
                          (x) => x.NomFichierIcone,
                          (x, s) => x.NomFichierIcone = s
                    );

                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_GRADE + nouveauNomFichierGrade));

               case ETypeRessource.PersonnageSecondaire:
                    var nouveauNomFichierPersoSecondaire = await UploadAsync<PersonnageSecondaire>(
                          _requete.idRessource,
                          _requete.Fichier,
                          Constant.CHEMIN_IMG_PERSONNAGE,
                          (x) => x.NomFichierPhotoIdentite,
                          (x, s) => x.NomFichierPhotoIdentite = s
                    );

                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_PERSONNAGE + nouveauNomFichierPersoSecondaire));

               case ETypeRessource.Boutique:
                    var nouveauNomFichierBoutique = await UploadAsync<Boutique>(
                         _requete.idRessource,
                         _requete.Fichier,
                         Constant.CHEMIN_IMG_BOUTIQUE,
                         (x) => x.NomFichier,
                         (x, s) => x.NomFichier = s
                    );

                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_BOUTIQUE + nouveauNomFichierBoutique));

               case ETypeRessource.Vaisseau:
                    var nouveauNomFichierVaisseau = await UploadAsync<Vaisseau>(
                         _requete.idRessource,
                         _requete.Fichier,
                         Constant.CHEMIN_IMG_VAISSEAU,
                         (x) => x.NomFichier,
                         (x, s) => x.NomFichier = s
                    );
                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_BOUTIQUE + nouveauNomFichierVaisseau));

               case ETypeRessource.Medaille:
                    var nouveauNomFichierMedaille = await UploadAsync<Medaille>(
                         _requete.idRessource,
                         _requete.Fichier,
                         Constant.CHEMIN_IMG_MEDAILLE,
                         (x) => x.NomFichier,
                         (x, s) => x.NomFichier = s
                    );

                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_MEDAILLE + nouveauNomFichierMedaille));

               case ETypeRessource.HistoriqueCampagne:
                    var nouveauNomFichierHistoCampagne = await UploadAsync<HistoriqueCampagne>(
                         _requete.idRessource,
                         _requete.Fichier,
                         Constant.CHEMIN_IMG_CAMPAGNE,
                         (x) => x.ListeNomFichier.Find(x => x == _requete.AncienNomFichierHistoriqueCampagne),
                         (x, s) =>
                         {
                              if(!string.IsNullOrWhiteSpace(_requete.AncienNomFichierHistoriqueCampagne))
                              {
                                   var index = x.ListeNomFichier.FindIndex(x => x == _requete.AncienNomFichierHistoriqueCampagne);
                                   x.ListeNomFichier[index] = s!;
                              }
                              else
                                   x.ListeNomFichier.Add(s!);
                         }
                    );

                    return Results.Ok(ConstruireUrlFichier(_httpContext, Constant.CHEMIN_IMG_CAMPAGNE + nouveauNomFichierHistoCampagne));

          }

          return Results.BadRequest("Erreur type de ressource");
     }

     static async Task<string?> UploadAsync<T>(
          int _idRessource, 
          IFormFile _fichier, 
          string _cheminBase, 
          Func<T, string?> _getter, 
          Action<T, string?> _setter
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var col = db.GetCollection<T>();

          var ressource = col.FindById(_idRessource);

          if (ressource is null)
               return null;

          string? nomFichier = _getter(ressource);
          string? nouveauNomFichier = null;

          if (string.IsNullOrWhiteSpace(nomFichier))
          {
               nouveauNomFichier = $"{Guid.NewGuid()}{Path.GetExtension(_fichier.FileName)}";
               _setter(ressource, nouveauNomFichier);

               col.Update(ressource);
          }
          else
               nouveauNomFichier = nomFichier;

          var baseUrl = Path.Join(Environment.CurrentDirectory, _cheminBase);

          if (!Directory.Exists(baseUrl))
               Directory.CreateDirectory(baseUrl);

          using (MemoryStream memoryStream = new())
          {
               // recupere le fichier dans memoryStream
               await _fichier.CopyToAsync(memoryStream);

               memoryStream.Seek(0, SeekOrigin.Begin);

               File.WriteAllBytes(Path.Combine(baseUrl, nouveauNomFichier), memoryStream.ToArray());
          }

          return nouveauNomFichier;
     }

    static string ConstruireUrlFichier(HttpContext _httpContext, string _nomFichier)
        => $"{_httpContext.Request.Scheme}://{_httpContext.Request.Host.Value}{_httpContext.Request.PathBase.Value}{_nomFichier}";
}
