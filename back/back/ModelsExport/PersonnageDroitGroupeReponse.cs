using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PersonnageDroitGroupeReponse
{
     public int Id { get; init; }
     public int? IdDroitGroupe { get; init; }
     public required string Nom { get; init; }
}

[JsonSerializable(typeof(PersonnageDroitGroupeReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PersonnageDroitGroupeReponseContext: JsonSerializerContext { }
