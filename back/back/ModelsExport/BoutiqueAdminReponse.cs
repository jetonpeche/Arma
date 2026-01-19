using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class BoutiqueAdminReponse
{
     public int Id { get; set; }
     public required string Titre { get; set; }
     public string? Description { get; set; }
     public required string UrlImageObjet { get; set; }
     public required BoutiqueAdminPrixReponse[] ListePrix { get; set; }
}

public sealed class BoutiqueAdminPrixReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
     public required int Ordre { get; set; }
     public required int Prix { get; set; }
}

[JsonSerializable(typeof(BoutiqueAdminReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class BoutiqueAdminReponseContext: JsonSerializerContext { }
