using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class MedailleRoute
{
     public static RouteGroupBuilder AjouterRouteMedaille(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", (Delegate)ListerAsync)
               .WithDescription("Lister les medailles")
               .Produces<Medaille[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter une medaille")
               .ProducesBadRequest()
               .ProducesNoContent();


          builder.MapPut("modifier/{idMedaille}", ModifierAsync)
               .WithDescription("Modifier une medaille")
               .ProducesBadRequest()
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     static async Task<IResult> ListerAsync(
          HttpContext _httpContext
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Medaille>().Query()
               .OrderBy(x => x.Nom)
               .Select(x => new MedailleReponse
               {
                    Id = x.Id,
                    Nom = x.Nom,
                    Description = x.Description,
                    Groupe = x.Groupe,
                    NbPoint = x.NbPoint,
                    NomFichier = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_MEDAILLE + x.NomFichier : "",
               }).ToArray();

          return Results.Extensions.Ok(liste, MedailleReponseContext.Default);
     }

     static async Task<IResult> AjouterAsync(
          [FromBody] MedailleRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom est obligatoire");

          if(string.IsNullOrWhiteSpace( _requete.Description))
               return Results.BadRequest("La description est obligatoire");

          if (_requete.NbPoint < 0)
               return Results.BadRequest("Le nombre de point ne peut pas être négatif");

          if (_requete.Groupe is not 0 and not 1 and not 2)
               return Results.BadRequest("0 => Personnelle, 1 => services, 2 => campagne");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var medaille = new Medaille
          {
               Description = _requete.Description.XSS(),
               Nom = _requete.Nom.XSS(),
               NbPoint = _requete.NbPoint,
               Groupe = _requete.Groupe
          };
          
          db.GetCollection<Medaille>().Insert(medaille);

          return Results.Created("", medaille.Id);
     }

     static async Task<IResult> ModifierAsync(
          [FromRoute(Name = "idMedaille")] int _idMedaille,
          [FromBody] MedailleRequete _requete
     )
     {
          if (_idMedaille <= 0)
               return Results.NotFound("La medaille n'existe pas");

          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom est obligatoire");

          if (string.IsNullOrWhiteSpace(_requete.Description))
               return Results.BadRequest("La description est obligatoire");

          if (_requete.NbPoint < 0)
               return Results.BadRequest("Le nombre de point ne peut pas être négatif");

          if (_requete.Groupe is not 0 and not 1 and not 2)
               return Results.BadRequest("0 => Personnelle, 1 => services, 2 => campagne");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var  nb = db.GetCollection<Medaille>().UpdateMany(x => new Medaille
          {
               Description = _requete.Description.XSS(),
               Nom = _requete.Nom.XSS(),
               NbPoint = _requete.NbPoint,
               Groupe = _requete.Groupe,
               NomFichier = x.NomFichier
          },
          x => x.Id == _idMedaille);

          return nb > 0 ? Results.NoContent() : Results.NotFound("La medaille n'existe pas");
     }
}
