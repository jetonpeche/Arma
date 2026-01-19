using back.Enums;

namespace back.ModelsImport;

public class FichierRequete
{
    public required int idRessource { get; set; }
    public required ETypeRessource TypeRessource { get; set; }
    public required IFormFile Fichier { get; set; }
}
