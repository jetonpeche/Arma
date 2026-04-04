using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class VaisseauLegerReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
}

[JsonSerializable(typeof(VaisseauLegerReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class VaisseauLegerReponseContext : JsonSerializerContext { }
