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

          builder.MapGet("lister-personnage/{idMedaille:int}", ListerPersonnageAsync)
               .Produces<List<IdValeurReponse>>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter une medaille")
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapPut("attribuer", AttribuerAsync)
               .WithDescription("Attribuer des médailles aux personnages")
               .ProducesNotFound()
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
                    ObtentionUnique = x.ObtentionUnique,
                    Description = x.Description,
                    Groupe = x.Groupe,
                    NbPoint = x.NbPoint,
                    NomFichier = x.NomFichier != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_MEDAILLE + x.NomFichier : "",
               }).ToArray();

          return Results.Extensions.Ok(liste, MedailleReponseContext.Default);
     }

     static async Task<IResult> ListerPersonnageAsync(
          [FromRoute(Name = "idMedaille")] int _idMedaille
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var medaille = db.GetCollection<Medaille>().Query()
               .Where(x => x.Id == _idMedaille)
               .Select(x => new
               {
                    x.Id,
                    x.ObtentionUnique
               })
               .FirstOrDefault();

          var listePersonnage = db.GetCollection<Personnage>().Query().ToList();

          IEnumerable<Personnage> listeRetour = [];

          if(medaille.ObtentionUnique)
          {
               listeRetour = listePersonnage.Where(x => x.ListeMedaille.Count == 0 || !x.ListeMedaille.Any(y => y.Medaille.Id == _idMedaille));
          }
          else
          {
               listeRetour = listePersonnage.ToList();
          }

          return Results.Extensions.Ok(listeRetour.Select(x => new IdValeurReponse
          {
               Id = x.Id,
               Nom = x.Nom
          }).ToList(), IdValeurReponseContext.Default);
     }

     static async Task<IResult> AttribuerAsync(
          HttpContext _httpContext,
          [FromBody] MedaillePersonnageRequete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var medaille = db.GetCollection<Medaille>().Query()
               .Where(x => x.Id == _requete.IdMedaille)
               .Select(x => new
               {
                    x.Id,
                    x.Nom,
                    x.ObtentionUnique,
                    x.NbPoint
               })
               .FirstOrDefault();

          if (medaille is null)
               return Results.NotFound("La medaille n'existe pas");

          var listeBsonId = _requete.ListeIdPersonnage.Select(x => new BsonValue(x)).ToArray();

          var listePersonnage = db.GetCollection<Personnage>().Query()
               .Where(Query.In("_id", listeBsonId))
               .ToList();

          if (listePersonnage.Count is 0) 
               return Results.NotFound("Aucun personnage n'existe");

          var nomAttributeur = db.GetCollection<Personnage>().Query().Where(x => x.Id == _httpContext.RecupererIdPersonnage())
               .Select(x => x.Nom)
               .First();

          foreach (var element in listePersonnage)
          {
               if (!element.ListeMedaille.Any(x => x.Medaille.Id == _requete.IdMedaille))
               {
                    element.ListeMedaille.Add(new()
                    {
                         Id = Guid.NewGuid(),
                         Medaille = new Medaille { Id = medaille.Id },
                         Quantite = 1
                    });

                    element.NbPointBoutique += medaille.NbPoint;

                    db.GetCollection<Historique>().Insert(new Historique
                    {
                         Information = $"{nomAttributeur} à attribuer la médaille {medaille.Nom} à {element.Nom}",
                         Date = DateTime.Now
                    });
               }
               else
               {
                    if (medaille.ObtentionUnique)
                         continue;

                    var medaillePersonnage = element.ListeMedaille.First(x => x.Medaille.Id == medaille.Id);
                    medaillePersonnage.Quantite += 1;

                    element.NbPointBoutique += medaille.NbPoint;

                    db.GetCollection<Historique>().Insert(new Historique
                    {
                         Information = $"{nomAttributeur} à attribuer la médaille {medaille.Nom} à {element.Nom}",
                         Date = DateTime.Now
                    });
               }
          }

          db.GetCollection<Personnage>().Update(listePersonnage);

          return Results.NoContent();
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
               Groupe = _requete.Groupe,
               ObtentionUnique = _requete.ObtentionUnique
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
               NomFichier = x.NomFichier,
               ObtentionUnique = _requete.ObtentionUnique
          },
          x => x.Id == _idMedaille);

          return nb > 0 ? Results.NoContent() : Results.NotFound("La medaille n'existe pas");
     }
}
