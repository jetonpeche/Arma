namespace back.ModelsImport.BatailleSpatials;

public sealed class SessionFichierDecorRequete
{
    public int? Id { get; set; }
    public string? NomRecherche { get; set; }
    public IFormFile Fichier { get; set; } = null!;
}
