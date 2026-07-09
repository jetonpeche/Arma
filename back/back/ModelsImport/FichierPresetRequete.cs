namespace back.ModelsImport;

public class FichierPresetRequete
{
    public required string Nom { get; set; }
    public required IFormFile Fichier { get; set; }
}
