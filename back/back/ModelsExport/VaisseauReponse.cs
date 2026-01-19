using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class VaisseauReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
     public required int Prix { get; set; }
     public required int Stock { get; set; }
     public required string Role { get; set; }
     public required string? CapaciteSpeciale { get; set; }

     public required StockageVaisseauReponse[] ListeStockage { get; set; }
     public required ArmementVaisseauReponse[] ListeArmement { get; set; }
     public required EquipageVaisseauReponse Equipage { get; set; }

     public string Vitesse { get; set; } = null!;
     public string Blindage { get; set; } = null!;
}

public sealed class StockageVaisseauReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
     public required int Taille { get; set; }

     public required TypeStockageLogistiqueReponse TypeStockage { get; set; }
}

public sealed class EquipageVaisseauReponse
{
     public required int NbPlacePassager { get; set; }
     public required int NbPlaceMarines { get; set; }
}

public sealed class ArmementVaisseauReponse
{
     public required Guid Id { get; set; }
     public required string Nom { get; set; } = null!;
     public required string? Information { get; set; }
     public required int Nombre { get; set; }
     public required int Munition { get; set; }
     public required bool MunitionInfini { get; set; }
     public required bool EstUsageUnique { get; set; }
     public required int NbTourReload { get; set; }
}

[JsonSerializable(typeof(VaisseauReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class VaisseauReponseContext : JsonSerializerContext { }
