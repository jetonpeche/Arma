using back.Extensions;
using back.Models;
using back.ModelsExport;
using back.ModelsImport;
using LiteDB;
using Microsoft.AspNetCore.Mvc;

namespace back.Routes;

public static class PresetRoute
{
    public static RouteGroupBuilder AjouterRoutePreset(this RouteGroupBuilder builder)
    {
        builder.MapGet("recuperer", (Delegate)RecupererAsync)
            .Produces<Preset>();

        builder.MapGet("telecharger", TelechargerAsync);

        builder.MapPost("publier", PublierAsync)
            .ProducesNotFound()
            .ProducesNoContent();

        builder.MapPost("modifier-fichier", ModifierFichierAsync)
            .DisableAntiforgery()
            .ProducesBadRequest()
            .ProducesNoContent();

        return builder;
    }

    static async Task<IResult> RecupererAsync(
        HttpContext _httpContext
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var info = db.GetCollection<Preset>().Query().FirstOrDefault();

        if (info is null)
            return Results.NotFound("Aucun preset");

        var preset = new PresetReponse
        {
            AliasNomFichier = info.AliasNomFichier ?? "",
            CodeAmiSteam = info.CodeAmiSteam,
            MdpArma = info.MdpArma,
            MdpTS = info.MdpTS,
            ServeurTS = info.ServeurTS
        };

        return Results.Extensions.Ok(preset, PresetReponseContext.Default);
    }

    static async Task<IResult> TelechargerAsync()
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var info = db.GetCollection<Preset>().Query().FirstOrDefault();

        if (info is null)
            return Results.NotFound("Aucun preset");

        if (info.NomFichier is null)
            return Results.NotFound("Aucun fichier");

        return Results.File(
            Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_PRESET, info.NomFichier),
            contentType: "application/octet-stream",
            fileDownloadName: "preset.html"
        );
    }

    static async Task<IResult> PublierAsync(
        [FromBody] PresetRequete _requete
    )
    {
        using var db = new LiteDatabase(Constant.BDD_NOM);

        var col = db.GetCollection<Preset>();
        var preset = col.Query().FirstOrDefault();

        if (preset is null)
        {
            col.Insert(new Preset
            {
                CodeAmiSteam = _requete.CodeAmiSteam.XSS(),
                MdpArma = _requete.MdpArma.XSS(),
                MdpTS = _requete.MdpTS.XSS(),
                ServeurTS = _requete.ServeurTS.XSS()
            });
        }
        else
        {
            preset.CodeAmiSteam = _requete.CodeAmiSteam.XSS();
            preset.MdpArma = _requete.MdpArma.XSS();
            preset.MdpTS = _requete.MdpTS.XSS();
            preset.ServeurTS = _requete.ServeurTS.XSS();

            col.Update(preset);
        }

        return Results.NoContent();
    }

    static async Task<IResult> ModifierFichierAsync(
        [FromForm] FichierPresetRequete _requete
    )
    {
        if (string.IsNullOrWhiteSpace(_requete.Nom))
            return Results.BadRequest("Le nom est obligatoire");

        if (_requete.Fichier is null || _requete.Fichier.Length is 0)
            return Results.BadRequest("Aucun fichier n'a été fourni.");

        if (_requete.Fichier.ContentType is not "text/html" || !_requete.Fichier.FileName.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            return Results.BadRequest("Format accepté: html");

        using var db = new LiteDatabase(Constant.BDD_NOM);

        var info = db.GetCollection<Preset>().Query().FirstOrDefault();

        if (info is null)
            return Results.NotFound("Aucun preset existant");

        await using var stream = _requete.Fichier.OpenReadStream();
        using var reader = new StreamReader(stream);
        string contenuHtmlBrut = await reader.ReadToEndAsync();

        string contenuNettoyer = contenuHtmlBrut.SupprimerScriptsEtStyles();

        var baseUrl = Path.Join(Environment.CurrentDirectory, Constant.CHEMIN_FICHIER_PRESET);
        
        if (!Directory.Exists(baseUrl))
            Directory.CreateDirectory(baseUrl);

        var cheminFichier = Path.Combine(baseUrl, "preset.html");
        await File.WriteAllTextAsync(cheminFichier, contenuNettoyer);

        info.NomFichier = "preset.html";
        info.AliasNomFichier = _requete.Nom;
        db.GetCollection<Preset>().Update(info);

        return Results.NoContent();
    }
}
