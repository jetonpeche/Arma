using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PersonnageMortReponse
{
    public required int Id { get; set; }
    public required string Nom { get; set; }
    public required string DateNaissance { get; set; }
    public required string DateMort { get; set; }
    public required int NbOperation { get; set; }
    public required string? NomGrade { get; set; }
    public required string? NomSpecialite { get; set; }
    public required string? ElogeFunebre { get; set; }
}

[JsonSerializable(typeof(PersonnageMortReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PersonnageMortReponseContext: JsonSerializerContext;
