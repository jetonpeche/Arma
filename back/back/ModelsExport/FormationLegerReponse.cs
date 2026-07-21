using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class FormationLegerReponse
{
     public required int Id { get; set; }
     public required string NomComplet { get; set; }
     public required string NomRaccourci { get; set; }
}

[JsonSerializable(typeof(FormationLegerReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class FormationLegerReponseContext : JsonSerializerContext;
