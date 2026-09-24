using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport.BatailleSpatials;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class SessionRoute
{
    public static RouteGroupBuilder AjouterRouteSession(this RouteGroupBuilder builder)
    {
        builder.MapGet("recuperer", (Delegate)RecupererAsync)
            .WithDescription("Recuperer la session de la bataille spatial")
            .Produces<SessionCombatReponse>();

        builder.MapPost("ajouter-pion", AjouterPionAsync)
               .WithDescription("Ajouter ou modifier un pion dans la session")
               .ProducesBadRequest()
               .ProducesNotFound()
               .Produces<string>();

        builder.MapPost("upload-fond", UploadAsync)
             .WithDescription("Ajouter ou modifier l'image de font d'une session")
             .ProducesBadRequest()
             .ProducesNotFound()
             .Produces<string>()
             .DisableAntiforgery();

        builder.MapPost("upload-decor", UploadDecorAsync)
            .WithDescription("Ajouter ou modifier l'image d'un decor dans la bibliotheque")
            .ProducesBadRequest()
            .ProducesNotFound()
            .Produces<string>()
            .DisableAntiforgery();

        builder.MapPost("placer-decor", PlacerDecorAsync)
             .WithDescription("Ajouter un decor sur la carte")
             .ProducesBadRequest()
             .ProducesNotFound()
             .Produces<string>();

        builder.MapPut("modifier-fond-transform", ModifierFondTransformAsync)
             .WithDescription("Modifier le transform du fond et de la carte")
             .ProducesBadRequest()
             .ProducesNotFound()
             .Produces<string>();

        builder.MapPut("modifier-decor-transform", ModifierDecorTransformAsync)
             .WithDescription("Met à jour position, échelle, rotation d'un décor existant")
             .ProducesNotFound()
             .ProducesNoContent();

        builder.MapPut("modifier-pion-transform", ModifierPionTransformAsync)
             .WithDescription("Met à jour position, échelle, rotation d'un décor existant")
             .ProducesNotFound()
             .ProducesNoContent();

        builder.MapDelete("vider", ViderAsync)
            .WithDescription("Vider la session, sans vider la bibliotheque")
            .ProducesNoContent();

        builder.MapDelete("supprimer-fond", SupprimerFondAsync)
             .WithDescription("Supprime l'image de fond")
             .ProducesNotFound()
             .ProducesNoContent();

        builder.MapDelete("supprimer-decor/{idDecor:guid}", SupprimerDecorAsync)
             .WithDescription("Supprime un décor")
             .ProducesNotFound()
             .ProducesNoContent();

        builder.MapDelete("supprimer-pion/{idPion:guid}", SupprimerPionAsync)
             .WithDescription("Supprime l'image de fond")
             .ProducesNotFound()
             .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> RecupererAsync(HttpContext _httpContext)
    {
        var db = new LiteDatabase(Constant.BDD_NOM);

        string baseUrl = _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE;

        var plateau = db.GetCollection<CombatSession>().Query()
            .Select(x => new SessionCombatReponse
            {
                Hauteur = x.Hauteur,
                Largeur = x.Largeur,
                NomPartie = x.NomPartie,
                UrlImagecarte = x.NomImageCarte != "" && x.NomImageCarte != null ? (baseUrl + x.NomImageCarte) : "",
                ListeDecor = x.ListeDecorSurCarte.Select(y => new SessionCombatDecorReponse
                {
                    IdDecor = y.IdDecor,
                    IdBibliothequeDecor = y.BibliothequeDecor.Id,
                    Echelle = y.Echelle,
                    OrdreCalque = y.OrdreCalque,
                    PositionX = y.PositionX,
                    PositionY = y.PositionY,
                    RotationDegres = y.RotationDegres,
                    VisibiliteMode = y.VisibiliteMode,
                    ListeIdUtilisateurAutoriser = y.IdUtilisateurAutoriser
                }).ToList(),
                ListePion = x.ListePionSurCarte.Select(y => new SessionCombatPionReponse
                {
                    IdPion = y.IdPion,
                    PositionX = y.PositionX,
                    PositionY = y.PositionY,
                    RotationDegres = y.RotationDegres,
                    RevelationType = y.RevelationType,
                    VisibiliteMode = y.VisibiliteMode,
                    IdUtilisateurAssigner = y.IdUtilisateurAssigner,
                    ListeIdUtilisateurAutoriser = y.IdUtilisateurAutoriser,
                    IdVaisseau = y.IdVaisseau
                }).ToList()
            }).First();

        plateau.BibliothequeDecor.AddRange(db.GetCollection<BibliothequeDecorCombat>().Query()
            .Select(x => new SessionCombatBibliothequeDecorReponse
            {
                Id = x.Id,
                NomRecheche = x.NomRecherche,
                UrlImage = baseUrl + x.NomImage
            }).ToList());

        string baseUrlVaisseau = _httpContext.Request.Scheme + "://" + _httpContext.Request.Host.Value + _httpContext.Request.PathBase.Value + Constant.CHEMIN_IMG_VAISSEAU;

        plateau.BibliothequeVaisseau.AddRange(db.GetCollection<Vaisseau>().Query()
            .Select(x => new SessionCombatBibliothequeVaisseauReponse
            {
                Id = x.Id,
                Nom = x.Nom,
                UrlImage = baseUrlVaisseau +  x.NomFichierSprite
            }).ToList());

        return Results.Ok(plateau);
    }

    static async Task<IResult> AjouterPionAsync(
        [FromBody] PionRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var session = db.GetCollection<CombatSession>().Query().First();

        var pion = new PionVaisseauCombat
        {
            IdPion = Guid.NewGuid(),
            IdVaisseau = _requete.IdVaisseau,
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY,
            RotationDegres = _requete.RotationDegres,
            EstVaisseauPosseder = _requete.Appartenance == Enums.EPionAjout.Posseder,
            IdUtilisateurAutoriser = [],
            RevelationType = Enums.ETypeRevelation.Complet,
            VisibiliteMode = _requete.Visibilite is 0 ? Enums.EModeVisibilite.Tous : Enums.EModeVisibilite.MjUniquement
        };

        if (_requete.Appartenance is Enums.EPionAjout.Pnj)
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
            session.ListePionSurCarte.Add(pion);
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

        var session = db.GetCollection<CombatSession>().Query().First();

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

        var baseUrl = Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE);

        if (!Directory.Exists(baseUrl))
            Directory.CreateDirectory(baseUrl);

        await using var stream = File.Create(Path.Combine(baseUrl, nouveauNomFichier));
        await _requete.Fichier.CopyToAsync(stream);

        return Results.Ok(ConstruireUrlFichier(_httpContext, nouveauNomFichier));
    }

    static async Task<IResult> UploadDecorAsync(
        HttpContext _httpContext,
        [FromForm] SessionFichierDecorRequete _requete
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

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var BibliothequeDecor = db.GetCollection<BibliothequeDecorCombat>();
        var baseUrl = Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE);

        BibliothequeDecorCombat? decor = null;
        
        if (_requete.Id.HasValue)
        {
            decor = db.GetCollection<BibliothequeDecorCombat>().FindById(_requete.Id.Value);

            if (decor is null)
                return Results.NotFound("Le decor existe pas");

            decor.NomRecherche = string.IsNullOrWhiteSpace(_requete.NomRecherche) ? null : _requete.NomRecherche.XSS();

            db.GetCollection<BibliothequeDecorCombat>().Update(decor);
        }
        else
        {
            decor = new BibliothequeDecorCombat
            {
                NomRecherche = string.IsNullOrWhiteSpace(_requete.NomRecherche) ? null : _requete.NomRecherche.XSS(),
                NomImage = $"{Guid.NewGuid()}{Path.GetExtension(_requete.Fichier.FileName)}"
            };

            db.GetCollection<BibliothequeDecorCombat>().Insert(decor);
        }

        if (!Directory.Exists(baseUrl))
            Directory.CreateDirectory(baseUrl);

        await using var stream = File.Create(Path.Combine(baseUrl, decor.NomImage));
        await _requete.Fichier.CopyToAsync(stream);

        return Results.Created("", new { decor.Id, UrlImage = ConstruireUrlFichier(_httpContext, decor.NomImage) });
    }

    static async Task<IResult> PlacerDecorAsync(
         [FromBody] SessionDecorPlacerRequete _requete
    )
    {
        if (_requete.IdBibliothequeDecor <= 0)
            return Results.NotFound("Le decor n'existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        if (!db.GetCollection<BibliothequeDecorCombat>().Exists(x => x.Id == _requete.IdBibliothequeDecor))
            return Results.NotFound("Le decor n'existe pas");

        var session = db.GetCollection<CombatSession>().Query().First();

        var decor = new ElementDecorCombat
        {
            IdDecor = Guid.NewGuid(),
            BibliothequeDecor = new() { Id = _requete.IdBibliothequeDecor },
            Echelle = _requete.Echelle,
            PositionX = _requete.PositionX,
            PositionY = _requete.PositionY,
            OrdreCalque = _requete.OrdreCalque,
            RotationDegres = _requete.RotationDegres,
            VisibiliteMode = _requete.VisibiliteMode is 0 ? Enums.EModeVisibilite.Tous : Enums.EModeVisibilite.MjUniquement
        };

        session.ListeDecorSurCarte.Add(decor);

        db.GetCollection<CombatSession>().Update(session);

        return Results.Created("", decor.IdDecor);
    }

    static async Task<IResult> ModifierFondTransformAsync(
         [FromBody] ModifierFondTransformRequete _requete
    )
    {

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var nb = db.GetCollection<CombatSession>().UpdateMany(_ => new CombatSession
        {
            Hauteur = _requete.Hauteur,
            Largeur = _requete.Largeur
        }, x => x.Id > 0);

        return nb > 0 ? Results.NoContent() : Results.NotFound("La session existe pas");
    }

    static async Task<IResult> ModifierDecorTransformAsync(
         [FromBody] ModifierDecorTransformRequete _requete
    )
    {
        if (_requete.IdDecor == Guid.Empty)
            return Results.NotFound("Le decor existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);
        var session = db.GetCollection<CombatSession>().Query().First();

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

    static async Task<IResult> ModifierPionTransformAsync(
         [FromBody] ModifierPionTransformRequete _requete
    )
    {
        if (_requete.IdPion == Guid.Empty)
            return Results.NotFound("Le pion existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var session = db.GetCollection<CombatSession>().Query().First();

        var vaisseau = session.ListePionSurCarte.FirstOrDefault(x => x.IdPion == _requete.IdPion);

        if (vaisseau is null)
            return Results.NotFound("Le pion existe pas");

        vaisseau.RotationDegres = _requete.RotationDegres;
        vaisseau.PositionX = _requete.PositionX;
        vaisseau.PositionY = _requete.PositionY;

        db.GetCollection<CombatSession>().Update(session);

        return Results.NoContent();
    }

    static async Task<IResult> ViderAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var session = db.GetCollection<CombatSession>().Query().First();
        string baseUrl = Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE);

        File.Delete(baseUrl + session.NomImageCarte);

        session.NomImageCarte = "";
        session.ListeDecorSurCarte.Clear();

        var vaisseauCol = db.GetCollection<VaisseauPosseder>();

        foreach (var element in session.ListePionSurCarte)
        {
            if (!element.EstVaisseauPosseder)
                vaisseauCol.Delete(element.IdVaisseau);
        }

        session.ListePionSurCarte.Clear();
        db.GetCollection<CombatSession>().Update(session);

        return Results.NoContent();
    }

    static async Task<IResult> SupprimerFondAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var nomFichier = db.GetCollection<CombatSession>().Query()
             .Select(x => x.NomImageCarte)
             .FirstOrDefault();

        if (string.IsNullOrWhiteSpace(nomFichier))
            return Results.NoContent();

        File.Delete(Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE, nomFichier));

        db.GetCollection<CombatSession>().UpdateMany(_ => new CombatSession
        {
            NomImageCarte = ""
        }, x => x.Id > 0);

        return Results.NoContent();
    }

    static async Task<IResult> SupprimerDecorAsync(
         [FromRoute(Name = "idDecor")] Guid _idDecor
    )
    {
        if (_idDecor == Guid.Empty)
            return Results.NotFound("Le decor dans la session existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var session = db.GetCollection<CombatSession>().Query()
             .FirstOrDefault();

        if (session is null)
            return Results.NotFound("La session existe pas");

        var decor = session.ListeDecorSurCarte.FirstOrDefault(x => x.IdDecor == _idDecor);

        if (decor is null)
            return Results.NotFound("Le decor dans la session existe pas");

        session.ListeDecorSurCarte.RemoveAll(x => x.IdDecor == _idDecor);

        db.GetCollection<CombatSession>().Update(session);

        return Results.NoContent();
    }

    static async Task<IResult> SupprimerPionAsync(
         [FromRoute(Name = "idPion")] Guid _idPion
    )
    {
        if (_idPion == Guid.Empty)
            return Results.NotFound("Le pion dans la session existe pas");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var session = db.GetCollection<CombatSession>().Query()
             .FirstOrDefault();

        if (session is null)
            return Results.NotFound("La session existe pas");

        var pion = session.ListePionSurCarte.FirstOrDefault(x => x.IdPion == _idPion);

        if (pion is null)
            return Results.NotFound("Le pion dans la session existe pas");

        session.ListePionSurCarte.RemoveAll(x => x.IdPion == _idPion);

        db.GetCollection<CombatSession>().Update(session);

        if (!pion.EstVaisseauPosseder)
            db.GetCollection<VaisseauPosseder>().DeleteMany(x => x.Id == pion.IdVaisseau);

        return Results.NoContent();
    }

    static string ConstruireUrlFichier(HttpContext _httpContext, string _nomFichier)
         => $"{_httpContext.Request.Scheme}://{_httpContext.Request.Host.Value}{_httpContext.Request.PathBase.Value}{Constant.CHEMIN_FICHIER_BATAILLE_SPATIALE}{_nomFichier}";
}
