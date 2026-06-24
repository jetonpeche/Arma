using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class TypeMaterielReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
}

[JsonSerializable(typeof(TypeMaterielReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class TypeMaterielReponseContext: JsonSerializerContext { }
