using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class GradeReponse
{
    public required int Id { get; set; }

    public required string Nom { get; set; } = null!;
    public required string UrlFichierIcone { get; set; }
    public string? Fonction { get; set; }

    public required int Ordre { get; set; }
    public int? NbPlace { get; set; }
    public int? NbOperationRequis { get; set; }

    public required int Conserne { get; set; }
    public required bool CandidatureRequise { get; set; }
    public required bool EstHonorifique { get; set; }
}

[JsonSerializable(typeof(GradeReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class GradeReponseContext: JsonSerializerContext { }
