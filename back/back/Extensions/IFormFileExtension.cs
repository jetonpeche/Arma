using System.Xml;

namespace back.Extensions;

public enum EReponseVerifFichier
{
    FormatPasAccepter,
    FichierVide,
    FichierNull,
    FichierTropCourt,
    SvgDangereux,
    Ok
}

public static class IFormFileExtension
{
    /// <summary>
    /// Vérifier l'extension du fichier par son type MIME
    /// </summary>
    /// <param name="_fichier"></param>
    /// <param name="_poidsMax">Poids en octel</param>
    /// <param name="_listeExtension">extensions autorisées (.jpeg, .jpg, .png, .webp, .svg). Si vide accepte tout</param>
    /// <returns></returns>
    public static EReponseVerifFichier Verifier(this IFormFile _fichier, int _poidsMax, string[] _listeExtension)
    {
        // https://en.wikipedia.org/wiki/List_of_file_signatures
        IReadOnlyDictionary<string, byte?[]> signatureFichier = new Dictionary<string, byte?[]>
        {
            [".jpeg"] = [0xFF, 0xD8, 0xFF],
            [".jpg"] = [0xFF, 0xD8, 0xFF],
            [".png"] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
            [".webp"] = [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]
        };

        if (_fichier is null)
            return EReponseVerifFichier.FichierNull;

        if (_fichier.Length is 0)
            return EReponseVerifFichier.FichierVide;

        string extension = Path.GetExtension(_fichier.FileName);

        if (_listeExtension.Length > 0 && !_listeExtension.Any(x => x == extension))
            return EReponseVerifFichier.FormatPasAccepter;

        if(extension is ".svg")
        {
            try
            {
                using (var stream = _fichier.OpenReadStream())
                {
                    var parametre = new XmlReaderSettings
                    {
                        DtdProcessing = DtdProcessing.Prohibit, // Bloque les attaques XXE
                        IgnoreWhitespace = true
                    };

                    using var reader = XmlReader.Create(stream, parametre);
                    
                    while (reader.Read())
                    {
                        // pas une balise
                        if (reader.NodeType is not XmlNodeType.Element)
                            continue;

                        if (reader.Name.Equals("script", StringComparison.OrdinalIgnoreCase))
                            return EReponseVerifFichier.SvgDangereux;

                        if (!reader.HasAttributes)
                            continue;
                        
                        for (int i = 0; i < reader.AttributeCount; i++)
                        {
                            reader.MoveToAttribute(i);

                            // Evénements js
                            if (reader.Name.StartsWith("on", StringComparison.OrdinalIgnoreCase))
                                return EReponseVerifFichier.SvgDangereux;

                            // Liens js href et xlink:href
                            if (!reader.Name.Contains("href", StringComparison.OrdinalIgnoreCase))
                                continue;
                                
                            // href contient un des trucs
                            string valeur = reader.Value.Replace(" ", "").Trim();

                            if (
                                valeur.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase) ||
                                valeur.StartsWith("vbscript:", StringComparison.OrdinalIgnoreCase) ||
                                valeur.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
                            )
                            {
                                return EReponseVerifFichier.SvgDangereux;
                            }
                        }

                        // Revenir à l'élément après avoir lu les attributs
                        reader.MoveToElement();            
                    }
                }
            }
            catch
            {
                // XML malformé ou invalide
                return EReponseVerifFichier.SvgDangereux;
            }

            return EReponseVerifFichier.Ok;
        }

        if (signatureFichier.TryGetValue(extension, out var signature))
        {
            using var stream = _fichier.OpenReadStream();

            var header = new byte[signature.Length];

            if (stream.Read(header, 0, header.Length) < signature.Length) 
                return EReponseVerifFichier.FichierTropCourt;

            for (int i = 0; i < signature.Length; i++)
            {
                if (signature[i] != null && signature[i] != header[i])
                    return EReponseVerifFichier.FormatPasAccepter;
            }
        }
        else
            return EReponseVerifFichier.FormatPasAccepter;

        return EReponseVerifFichier.Ok;
    }
}
