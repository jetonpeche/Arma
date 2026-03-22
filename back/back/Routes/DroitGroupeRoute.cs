using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class DroitGroupeRoute
{
     public static RouteGroupBuilder AjouterRouteDroitGroupe(this RouteGroupBuilder builder)
     {
          builder.MapGet("lister", ListerAsync)
               .WithDescription("Lister les droits")
               .Produces<DroitGroupeReponse[]>();

          builder.MapGet("lister-personnage", ListerPersonnageAsync)
               .WithDescription("Lister les personnages avec son id droit")
               .Produces<PersonnageDroitGroupeReponse[]>();

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouveau droit")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPut("modifier/{idDroitGroupe:int}", ModifierAsync)
               .WithDescription("Modifier un groupe de droit")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapPut("modifier-droit-personnage", ModifierPersonnageAsync)
               .WithDescription("Modifier le groupe de droit de personnage(s)")
               .ProducesNotFound()
               .ProducesBadRequest()
               .ProducesNoContent();

          builder.MapDelete("supprimer/{idDroitGroupe:int}", SupprimerAsync)
               .WithDescription("Supprimer un groupe de droit")
               .ProducesNotFound()
               .ProducesNoContent();

          return builder;
     }

     async static Task<IResult> ListerAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<DroitGroupe>().Query()
               .OrderBy(x => x.Nom)
               .ToEnumerable()
               .Select(x => new DroitGroupeReponse
               {
                    Id = x.Id,
                    Nom = x.Nom,
                    PeutAcheterVaisseau = x.PeutAcheterVaisseau,
                    PeutAcheterLogistiqueMateriel = x.PeutAcheterLogistiqueMateriel,
                    PeutProposerLogistiqueMateriel = x.PeutProposerLogistiqueMateriel,
                    ListeDroit = x.ListeDroit.OrderBy(y => y.RouteGroupe).ToArray()
               })
               .ToArray();

          return Results.Extensions.Ok(liste, DroitProgrammerReponseContext.Default);
     }

     async static Task<IResult> ListerPersonnageAsync()
     {
          using var db = new LiteDatabase(Constant.BDD_NOM);

          var liste = db.GetCollection<Personnage>().Query()
               .OrderBy(x => x.Nom)
               .Select(x => new PersonnageDroitGroupeReponse
               {
                    Id = x.Id,
                    Nom = x.Nom,
                    IdDroitGroupe = x.DroitGroupe.Id
               })
               .ToArray();

          return Results.Extensions.Ok(liste, PersonnageDroitGroupeReponseContext.Default);
     }

     async static Task<IResult> AjouterAsync(
          [FromBody] DroitGroupeRequete _requete
     )
     {
          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          var droitGroupe = new DroitGroupe
          {
               Nom = _requete.Nom.XSS(),
               PeutAcheterLogistiqueMateriel = _requete.PeutAcheterLogistiqueMateriel,
               PeutProposerLogistiqueMateriel = _requete.PeutProposerLogistiqueMateriel,
               PeutAcheterVaisseau = _requete.PeutAcheterVaisseau,
               ListeDroit = _requete.ListeDroit.ToList()
          };

          using var db = new LiteDatabase(Constant.BDD_NOM);

          int id = db.GetCollection<DroitGroupe>().Insert(droitGroupe);

          return Results.Created("", id);
     }

     async static Task<IResult> ModifierAsync(
          [FromRoute(Name = "idDroitGroupe")] int _idDroitGroupe,
          [FromBody] DroitGroupeRequete _requete
     )
     {
          if (_idDroitGroupe <= 0)
               return Results.NotFound("Le groupe de droit n'existe pas");

          if (string.IsNullOrWhiteSpace(_requete.Nom))
               return Results.BadRequest("Le nom ne peut pas être vide");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var droitGroupe = new DroitGroupe
          {
               Id = _idDroitGroupe,
               Nom = _requete.Nom.XSS(),
               PeutAcheterLogistiqueMateriel = _requete.PeutAcheterLogistiqueMateriel,
               PeutProposerLogistiqueMateriel = _requete.PeutProposerLogistiqueMateriel,
               PeutAcheterVaisseau = _requete.PeutAcheterVaisseau,
               ListeDroit = _requete.ListeDroit.ToList()
          };

          var ok = db.GetCollection<DroitGroupe>().Update(droitGroupe);

          return ok ? Results.NoContent() : Results.NotFound("Le groupe de droit n'existe pas");
     }

     async static Task<IResult> ModifierPersonnageAsync(
          [FromBody] DroitGroupePersonnageRequete[] _requete
     )
     {
          if(_requete.Length is 0)
               return Results.BadRequest("Aucun droit personnage à modifier");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var listeIdPersonnage = _requete.Select(x => x.IdPersonnage);
          var dictIdPersonnageIdDroitGroupe = _requete.ToDictionary(x => x.IdPersonnage, x => x.IdDroitGroupe);

          var listeIdDroitGroupe = db.GetCollection<DroitGroupe>().Query().Select(x => x.Id).ToArray();
          var listePersonnage = db.GetCollection<Personnage>().Query().Where(x => listeIdPersonnage.Contains(x.Id)).ToList();

          if (listePersonnage.Count is 0)
               return Results.NotFound("Aucun personnage existe");

          foreach (var element in listePersonnage)
          {
               var idDroitGroupe = dictIdPersonnageIdDroitGroupe[element.Id];
               element.DroitGroupe = idDroitGroupe.HasValue ? new DroitGroupe { Id = idDroitGroupe.Value } : null;
          }

          db.GetCollection<Personnage>().Update(listePersonnage);

          return Results.NoContent();
     }

     async static Task<IResult> SupprimerAsync(
          [FromRoute(Name = "idDroitGroupe")] int _idDroitGroupe
     )
     {
          if (_idDroitGroupe <= 0)
               return Results.NotFound("Le groupe de droit n'existe pas");

          using var db = new LiteDatabase(Constant.BDD_NOM);

          var ok = db.GetCollection<DroitGroupe>().Delete(_idDroitGroupe);

          if(ok)
               db.GetCollection<Personnage>().UpdateMany(x => new Personnage { DroitGroupe = null }, x => x.DroitGroupe != null && x.DroitGroupe.Id == _idDroitGroupe);

          return ok ? Results.NoContent() : Results.NotFound("Le droit n'existe pas");
     }
}
