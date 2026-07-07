using back.Extensions;
using back.Models;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class SpecialiteRoute
{
    public static RouteGroupBuilder AjouterRouteSpecialite(this RouteGroupBuilder builder)
    {
          builder.MapGet("lister", ListerAsync)
               .WithDescription("Lister les spécialités");

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter une nouvelle spécialité")
               .ProducesCreated<int>();

          builder.MapPut("modifier/{idSpecialite:int}", ModifierAsync)
               .WithDescription("Modifier une spécialité")
               .ProducesNotFound()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idSpecialite:int}", SupprimerAsync)
               .WithDescription("Supprimer une spécialité")
               .ProducesNotFound()
               .ProducesNoContent();

             return builder;
    }

    static async Task<IResult> ListerAsync(
         HttpContext _httpContext,
         [FromQuery(Name = "leger")] bool _modeLeger
     )
    {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var requete = db.GetCollection<Specialite>().Query()
               .OrderBy(x => x.Nom);

          if (_modeLeger)
          {
               return Results.Ok(
                    requete.Select(x => new
                    {
                         x.Id,
                         x.Nom,
                         x.EstNavy
                    })
                    .ToArray()
               );
          }
          else
          {
               return Results.Ok(
                    requete.Include(x => x.Grade).Select(x => new
                    {
                         x.Id,
                         x.Nom,
                        x.Description,
                        x.Categorie,
                        IdParents = x.ListeParent.Select(x => x.Id).ToList(),
                         Grade = new
                         {
                              x.Grade.Id,
                              x.Grade.Nom,
                              x.Grade.NbOperationRequis
                         },
                         x.Raccourci,
                         x.EstNavy,
                         urlImage = x.NomImage != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_SPECIALITE + x.NomImage : ""
                    })
                    .ToArray()
               );
          }
    }

    static async Task<IResult> AjouterAsync(
        [FromBody] SpecialiteRequete _requete
    )
    {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var col = db.GetCollection<Specialite>();

          if (_requete.ListeIdParent.Length > 0)
          {
               var listeIdSpecialiteBson = _requete.ListeIdParent.Select(x => new BsonValue(x)).ToArray();
            
               var nb = col.Query()
                    .Where(Query.In("_id", listeIdSpecialiteBson))
                    .Count();

               if (nb != _requete.ListeIdParent.Length)
                    return Results.NotFound($"Un des parent n'existe pas");
          }
          
          if(!db.GetCollection<Grade>().Exists(x => x.Id == _requete.IdGrade))
               return Results.NotFound("Le grade n'existe pas");

          var specialite = new Specialite
          {
               Nom = _requete.Nom.XSS(),
              Raccourci = _requete.Raccourci.XSS(),
              Categorie = _requete.Categorie?.XSS() ?? "",
              Grade = new() { Id = _requete.IdGrade },
              ListeParent = [.. _requete.ListeIdParent.Select(x => new Specialite{ Id = x })],
              Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description?.XSS(),
               EstNavy = _requete.EstNavy
          };

          int id = col.Insert(specialite);

          return Results.Created("", id);
    }

    static async Task<IResult> ModifierAsync(
        [FromRoute(Name = "idSpecialite")] int _idSpecialite,
        [FromBody] SpecialiteRequete _requete
    )
    {
          if (_idSpecialite <= 0)
               return Results.NotFound("La spécialité n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

        var col = db.GetCollection<Specialite>();

        if (!col.Exists(x => x.Id == _idSpecialite))
          return Results.NotFound("La spécialité n'existe pas");

          if (_requete.ListeIdParent.Length > 0)
          {
               var listeIdSpecialiteBson = _requete.ListeIdParent.Select(x => new BsonValue(x)).ToArray();
            
               var nb = col.Query()
                    .Where(Query.In("_id", listeIdSpecialiteBson))
                    .Count();

               if (nb != _requete.ListeIdParent.Length)
                    return Results.NotFound("Un des parent n'existe pas");
          }
          
          if(!db.GetCollection<Grade>().Exists(x => x.Id == _requete.IdGrade))
            return Results.NotFound("Le grade n'existe pas");

          var specialite = col.FindById(_idSpecialite);

          specialite.Nom = _requete.Nom.XSS();
          specialite.Raccourci = _requete.Raccourci.XSS();
          specialite.Categorie = _requete.Categorie?.XSS() ?? "";
          specialite.Grade = new() { Id = _requete.IdGrade };
          specialite.ListeParent = [.. _requete.ListeIdParent.Select(x => new Specialite{ Id = x })];
          specialite.Description = string.IsNullOrWhiteSpace(_requete.Description) ? null : _requete.Description?.XSS();
          specialite.EstNavy = _requete.EstNavy;

        var ok = col.Update(specialite);

        return ok ? Results.NoContent() : Results.NotFound("La spécialité n'existe pas");
    }

    static async Task<IResult> SupprimerAsync(
        [FromRoute(Name = "idSpecialite")] int _idSpecialite
    )
    {
          if(_idSpecialite <= 0)
               return Results.NotFound("La spécialité n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var specialiteCol = db.GetCollection<Specialite>();

          var specialite = specialiteCol.Query()
                    .Where(x => x.Id == _idSpecialite)
                    .FirstOrDefault();

          if (specialite is null)
               return Results.NotFound("La spécialité n'existe pas");

          var listeSpecialiteEnfant = specialiteCol.Query()
               .Where(x => x.ListeParent.Select(y => y.Id).Any(y => y == _idSpecialite))
               .ToList();

          if (listeSpecialiteEnfant.Count > 0)
          {
               var estSansParent = specialite.ListeParent.Count is 0;
             
               foreach (var element in listeSpecialiteEnfant)
               {
                    if (estSansParent)
                         element.ListeParent.RemoveAll(x => x.Id == _idSpecialite);
                    
                    else
                         element.ListeParent = specialite.ListeParent; 
               }

               specialiteCol.Update(listeSpecialiteEnfant);
          }

        if (specialite is not null)
             File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_SPECIALITE + specialite.NomImage));

        specialiteCol.Delete(_idSpecialite);
        db.GetCollection<Personnage>().UpdateMany(
             _ => new() { Specialite = null }, 
             y => y.Specialite != null && y.Specialite.Id == _idSpecialite
        );

        return Results.NoContent();
    }
}
