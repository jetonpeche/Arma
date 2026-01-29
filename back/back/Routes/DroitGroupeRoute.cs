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

          builder.MapPost("ajouter", AjouterAsync)
               .WithDescription("Ajouter un nouveau droit")
               .ProducesBadRequest()
               .ProducesCreated<int>();

          builder.MapPut("modifier/{idDroitGroupe:int}", ModifierAsync)
               .WithDescription("Modifier un groupe de droit")
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
                    ListeDroit = x.ListeDroit.OrderBy(y => y.RouteGroupe).ToArray()
               })
               .ToArray();

          return Results.Extensions.Ok(liste, DroitProgrammerReponseContext.Default);
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
               PeutAcheterVaisseau = _requete.PeutAcheterVaisseau,
               ListeDroit = _requete.ListeDroit.ToList()
          };

          var ok = db.GetCollection<DroitGroupe>().Update(droitGroupe);

          return ok ? Results.NoContent() : Results.NotFound("Le groupe de droit n'existe pas");
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
