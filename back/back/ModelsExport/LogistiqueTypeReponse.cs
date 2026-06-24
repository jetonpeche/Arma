using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class LogistiqueTypeReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
}

[JsonSerializable(typeof(LogistiqueTypeReponse[]))]
[JsonSerializable(typeof(LogistiqueTypeReponse))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class LogistiqueTypeReponseContext: JsonSerializerContext { }
