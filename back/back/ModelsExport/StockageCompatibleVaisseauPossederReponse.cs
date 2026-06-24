using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class StockageCompatibleVaisseauPossederReponse
{
    public required int Id { get; set; }
    public required string NomVaisseau { get; set; }
    public required string? NomVaisseauAlias { get; set; }

    public required List<StockageVaisseauPossederReponse> ListeStockage { get; set; }
}

[JsonSerializable(typeof(List<StockageCompatibleVaisseauPossederReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class StockageCompatibleVaisseauPossederReponseContext: JsonSerializerContext;
