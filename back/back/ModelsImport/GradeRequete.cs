using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class GradeRequete
{
    public required string Nom { get; set; }
    public string? Fonction { get; set; }

    public int Ordre { get; set; }

    public int NbPlace { get; set; }
    public int NbOperationRequis { get; set; }
     public int NbPointBoutiqueGagnerParOperation { get; set; }

     public int Conserne { get; set; }
    public bool CandidatureRequise { get; set; }
    public bool EstHonorifique { get; set; }
}

[JsonSerializable(typeof(GradeRequete))]
public partial class GradeRequeteContext: JsonSerializerContext { }
