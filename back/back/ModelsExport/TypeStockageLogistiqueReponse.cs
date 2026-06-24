using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class TypeStockageLogistiqueReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
}

[JsonSerializable(typeof(TypeStockageLogistiqueReponse[]))]
[JsonSerializable(typeof(TypeStockageLogistiqueReponse))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class TypeStockageLogistiqueReponseContext : JsonSerializerContext { }
