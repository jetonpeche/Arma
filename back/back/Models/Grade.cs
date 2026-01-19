using LiteDB;

namespace back.Models;

public sealed class Grade
{
    [BsonId]
    public int Id { get; set; }

    public string Nom { get; set; } = null!;
    public string? NomFichierIcone { get; set; }
    public string? Fonction { get; set; }

    public int Ordre { get; set; }
    public int NbPlace { get; set; }
    public int NbOperationRequis { get; set; }
     public int NbPointBoutiqueGagnerParOperation { get; set; }

     public int Conserne { get; set; }
    public bool CandidatureRequise { get; set; }
    public bool EstHonorifique { get; set; }
}
