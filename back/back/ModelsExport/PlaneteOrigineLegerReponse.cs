using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PlaneteOrigineLegerReponse
{
    public required int Id { get; set; }
    public required string Nom { get; set; }
}

[JsonSerializable(typeof(PlaneteOrigineLegerReponse))]
[JsonSerializable(typeof(PlaneteOrigineLegerReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PlaneteOrigineLegerReponseContext : JsonSerializerContext { }
