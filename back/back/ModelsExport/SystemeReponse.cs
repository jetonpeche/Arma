using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class SystemeReponse
{
    public required int Id { get; set; }
    public required string Nom { get; set; } = null!;
    public required string? Description { get; set; }
    public required decimal PositionX { get; set; }
    public required decimal PositionY { get; set; }
}

public sealed class SystemeLegerReponse
{
    public required int Id { get; set; }
    public required string Nom { get; set; } = null!;
}

[JsonSerializable(typeof(List<SystemeReponse>))]
[JsonSerializable(typeof(List<SystemeLegerReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class SystemeReponseContext: JsonSerializerContext;
