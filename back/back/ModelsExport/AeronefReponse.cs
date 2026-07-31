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

public sealed class AeronefLegerReponse
{
    public int Id { get; set; }
    public string Nom { get; set; } = null!;
}

[JsonSerializable(typeof(AeronefReponse[]))]
[JsonSerializable(typeof(AeronefLegerReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class AeronefReponseContext: JsonSerializerContext;
