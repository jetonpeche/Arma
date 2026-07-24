using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class ContenuStockagePossederReponse
{
    public required int Id { get; set; }
    public required string Nom { get; set; }
    public required int Quantite { get; set; }
}

[JsonSerializable(typeof(ContenuStockagePossederReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class ContenuStockagePossederReponseContext: JsonSerializerContext;
