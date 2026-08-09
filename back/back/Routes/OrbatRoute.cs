using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class OrbatRoute
{
     public static RouteGroupBuilder AjouterRouteOrbat(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", (Delegate)ListerAsync)
               .WithDescription("Lister les orbats")
               .Produces<OrbatReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un element à l'orbat")
               .ProducesCreated();

          builder.MapPut("modifier/{idOrbat:int}", ModifierAsync)
               .WithDescription("Modifier un element à l'orbat")
               .ProducesNotFound()
               .ProducesCreated();

          builder.MapDelete("supprimer/{idOrbat:int}", SupprimerAsync)
               .WithDescription("Supprimer un element de l'orbat")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     static async Task<IResult> ListerAsync(HttpContext _httpContext)
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Orbat>().Query()
               .Include(x => x.ListeSlot.Select(x => x.Personnage))
               .Include(x => x.ListeSlot.Select(x => x.GradeRequis))
               .Select(x => new OrbatReponse
               {
                    Id = x.Id,
                    IdParent = x.Parent.Id,
                    Titre = x.Titre,
                    Indicatif = x.Indicatif,
                    FrequenceRadio = x.FrequenceRadio,
                    UrlImage = x.NomImage != null ? _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_ORBAT + x.NomImage : "",
                    ListeSlot = x.ListeSlot.Select(y => new OrbatSlotReponse
                    {
                         Personnage = y.Personnage != null ? new PersonnageLegerReponse
                         {
                              Id = y.Personnage.Id,
                              Nom = y.Personnage.Nom
                         } : null,
                         GradeRequis = y.GradeRequis != null ? new GradeLegerReponse
                         {
                              Id = y.GradeRequis.Id,
                              Nom = y.GradeRequis.Nom,
                              NomRaccourci = y.GradeRequis.NomRaccourci
                         } : null,
                         OrdreAffichage = y.OrdreAffichage,
                         Role = y.Role,
                         EstOptionnel = y.EstOptionnel
                    }).ToList()
               })
               .ToArray();

          return Results.Ok(liste);
     }

     static async Task<IResult> AjouterAsync(
          [FromBody] OrbatRequete _requete
     )
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var colOrbat = db.GetCollection<Orbat>();

          if (_requete.IdParent.HasValue && !colOrbat.Exists(x => x.Id == _requete.IdParent.Value))
               return Results.NotFound("Le parent n'existe pas");

          var listeIdPersonnageBson = _requete.ListeSlot.Where(x => x.IdPersonnage.HasValue)
               .Select(x => new BsonValue(x.IdPersonnage!.Value));

          var listeIdGradeRequisBson = _requete.ListeSlot.Where(x => x.IdGradeRequis.HasValue)
               .Select(x => new BsonValue(x.IdGradeRequis!.Value));

          if (db.GetCollection<Personnage>().Query().Where(Query.In("_id", listeIdPersonnageBson)).Count() != listeIdPersonnageBson.Count())
               return Results.BadRequest("Un des personnages n'existe pas");

          if (db.GetCollection<Grade>().Query().Where(Query.In("_id", listeIdGradeRequisBson)).Count() != listeIdGradeRequisBson.Count())
               return Results.BadRequest("Un des grades n'existe pas");

          var orbat = new Orbat
          {
               Titre = _requete.Titre?.XSS(),
               FrequenceRadio = _requete.FrequenceRadio?.XSS(),
               Indicatif = _requete.Indicatif?.XSS(),
               Parent = _requete.IdParent.HasValue ? new() { Id = _requete.IdParent!.Value } : null,
               ListeSlot = _requete.ListeSlot.ConvertAll(x => new OrbatSlot
               {
                    Role = x.Role,
                    EstOptionnel = x.EstOptionnel,
                    OrdreAffichage = x.OrdreAffichage,
                    GradeRequis = x.IdGradeRequis.HasValue ? new() { Id = x.IdGradeRequis.Value } : null,
                    Personnage = x.IdPersonnage.HasValue ? new() { Id = x.IdPersonnage.Value } : null
               })
          };

          colOrbat.Insert(orbat);

          return Results.Created();
     }

     static async Task<IResult>ModifierAsync(
          [FromRoute(Name = "idOrbat")] int _idOrbat,
          [FromBody] OrbatRequete _requete
     )
     {
          if (_requete.IdParent <= 0)
               _requete.IdParent = null;

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var colOrbat = db.GetCollection<Orbat>();

          if (_requete.IdParent.HasValue && !colOrbat.Exists(x => x.Id == _requete.IdParent.Value))
               return Results.NotFound("Le parent n'existe pas");

          var listeIdPersonnageBson = _requete.ListeSlot.Where(x => x.IdPersonnage.HasValue)
               .Select(x => new BsonValue(x.IdPersonnage!.Value));

          var listeIdGradeRequisBson = _requete.ListeSlot.Where(x => x.IdGradeRequis.HasValue)
               .Select(x => new BsonValue(x.IdGradeRequis!.Value));

          if (db.GetCollection<Personnage>().Query().Where(Query.In("_id", listeIdPersonnageBson)).Count() != listeIdPersonnageBson.Count())
               return Results.BadRequest("Un des personnages n'existe pas");

          if (db.GetCollection<Grade>().Query().Where(Query.In("_id", listeIdGradeRequisBson)).Count() != listeIdGradeRequisBson.Count())
               return Results.BadRequest("Un des grades n'existe pas");

          var orbat = colOrbat.FindById(_idOrbat);

          orbat.Titre = _requete.Titre?.XSS();
          orbat.FrequenceRadio = _requete.FrequenceRadio?.XSS();
          orbat.Indicatif = _requete.Indicatif?.XSS();
          orbat.ListeSlot = _requete.ListeSlot.ConvertAll(x => new OrbatSlot
          {
               Role = x.Role,
               EstOptionnel = x.EstOptionnel,
               OrdreAffichage = x.OrdreAffichage,
               GradeRequis = x.IdGradeRequis.HasValue ? new() { Id = x.IdGradeRequis.Value } : null,
               Personnage = x.IdPersonnage.HasValue ? new() { Id = x.IdPersonnage.Value } : null
          });

          var ok = colOrbat.Update(orbat);

          return ok ? Results.NoContent() : Results.NotFound("L'element n'existe pas");
     }

     static async Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idOrbat")] int _idOrbat
     )
     {
          if (_idOrbat <= 0)
               return Results.NotFound("L'element n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var colOrbat = db.GetCollection<Orbat>();

          var info = colOrbat.Query()
               .Where(x => x.Id == _idOrbat)
               .Select(x => new { x.NomImage, IdParent = x.Parent.Id })
               .FirstOrDefault();

          if (!string.IsNullOrWhiteSpace(info.NomImage))
               File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_IMG_ORBAT + info.NomImage));

          var listeEnfantDuParentAsupprimer = colOrbat.Query()
               .Where(x => x.Parent.Id == _idOrbat)
               .ToArray();

          foreach (var enfant in listeEnfantDuParentAsupprimer)
               enfant.Parent = new Orbat { Id = info.IdParent };

          var ok = colOrbat.Delete(_idOrbat);

          if(ok)
               colOrbat.Update(listeEnfantDuParentAsupprimer);

          return ok ? Results.NoContent() : Results.NotFound();
     }
}
