namespace back.ModelsImport.BatailleSpatials;

public sealed class SessionFichierFondRequete
{
     public required int Hauteur { get; set; }
     public required int Largeur { get; set; }
     public required IFormFile Fichier { get; set; }
}
