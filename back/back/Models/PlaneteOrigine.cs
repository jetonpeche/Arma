using LiteDB;
using System.Text.Json.Serialization;

namespace back.Models;

public sealed class PlaneteOrigine
{
    [BsonId]
    public int Id { get; set; }
    public string Nom { get; set; } = null!;
}

[JsonSerializable(typeof(PlaneteOrigine[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PlaneteOrigineContext: JsonSerializerContext { }
