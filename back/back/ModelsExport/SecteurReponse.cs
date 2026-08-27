using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class SecteurReponse
{
    public required int Id { get; set; }
    public required string Nom { get; set; } = null!;
    public required string? Description { get; set; }
    public required decimal PositionX { get; set; }
    public required decimal PositionY { get; set; }
}

public sealed class SecteurLegerReponse
{
    public required int Id { get; set; }
    public required string Nom { get; set; } = null!;
}

[JsonSerializable(typeof(List<SecteurReponse>))]
[JsonSerializable(typeof(List<SecteurLegerReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class SecteurReponseContext: JsonSerializerContext;
