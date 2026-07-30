using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class AeronefReponse
{
    public int Id { get; set; }

    public int Prix { get; set; }

    public string Nom { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string? Description { get; set; }
    public required string UrlImage { get; set; }
}

[JsonSerializable(typeof(AeronefReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class AeronefReponseContext: JsonSerializerContext;
