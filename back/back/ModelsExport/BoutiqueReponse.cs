using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class BoutiqueReponse
{
     public required int Id { get; set; }
     public int IdPrix { get; set; }
     public int Prix { get; set; }
     public string Nom { get; set; } = null!;
     public required string UrlImageObjet { get; set; }
     public string? Description { get; set; }
     public bool EstPosseder { get; set; }
}

[JsonSerializable(typeof(BoutiqueReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class BoutiqueReponseContext: JsonSerializerContext { }
