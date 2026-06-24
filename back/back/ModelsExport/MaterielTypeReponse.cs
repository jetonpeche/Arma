using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class MaterielTypeReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
}

[JsonSerializable(typeof(MaterielTypeReponse[]))]
[JsonSerializable(typeof(MaterielTypeReponse))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class MaterielTypeReponseContext : JsonSerializerContext { }
