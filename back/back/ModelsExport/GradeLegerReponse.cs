using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class GradeLegerReponse
{
    public required int Id { get; set; }
    public required string Nom { get; set; }
}

[JsonSerializable(typeof(GradeLegerReponse))]
[JsonSerializable(typeof(GradeLegerReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class GradeLegerReponseContext: JsonSerializerContext { }
