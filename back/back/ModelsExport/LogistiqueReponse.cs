using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class LogistiqueReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
     public required string? Description { get; set; }
     public required int Prix { get; set; }
     public required LogistiqueStockReponse[] ListeStockageVaisseau { get; set; }
     public required int NbDetruit { get; set; }
     public required int TailleUnitaireInventaire { get; set; }
     public required bool IgnoreTypeStockage { get; set; }
     public required bool EstKit { get; set; }
     public required LogistiqueTypeReponse Type  { get; set; }
     public required TypeStockageLogistiqueReponse TypeStockage { get; set; }
}

public sealed class LogistiqueStockReponse
{
     public required string NomVaisseau { get; set; }
     public required string NomStockage { get; set; }
    public required int Quantite { get; set; }
}

[JsonSerializable(typeof(LogistiqueReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class LogistiqueReponseContext: JsonSerializerContext { }
