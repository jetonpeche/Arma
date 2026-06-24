using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class MaterielReponse
{
     public required int Id { get; set; }
     public required MaterielTypeReponse Type { get; set; }
     public required string Nom { get; set; }
     public required string? Description { get; set; }
     public required int Prix { get; set; }
     public required int Stock { get; set; }
     public required int NbPlacer { get; set; }
     public required int NbDetruit { get; set; }
}

[JsonSerializable(typeof(MaterielReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class MaterielReponseContext: JsonSerializerContext { }
