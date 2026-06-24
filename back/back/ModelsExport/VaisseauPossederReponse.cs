using System.Text.Json.Serialization;

namespace back.ModelsExport;

public class VaisseauPossederReponse
{
    public required int Id { get; set; }
    public required string? NomCommandant { get; set; }
    public required string NomVaisseau { get; set; }
    public required string? NomVaisseauAlias { get; set; }
    public required string? Information { get; set; }
    public required ArmementVaisseauPossederReponse[] ListeArmement { get; set; }
    public required StockageVaisseauPossederReponse[] ListeStockage { get; set; }
}

public sealed class ArmementVaisseauPossederReponse
{
    public required Guid Id { get; set; }
    public required string Nom { get; set; } = null!;
    public required string? Information { get; set; }
    public required int NombreMax { get; set; }
    public required int NombreDisponible { get; set; }

    public required int MunitionMax { get; set; }
    public required int MunitionDisponible { get; set; }

    public required bool MunitionInfini { get; set; }
    public required bool EstUsageUnique { get; set; }
    public required int NbTourReload { get; set; }
}

public sealed class StockageVaisseauPossederReponse
{
    public required int Id { get; set; }
    public int IdTypeStockage { get; set; }
    public required string Nom { get; set; }
    public required int Taille { get; set; }
    public required int Occuper { get; set; }
    public int Disponible => Taille - Occuper;
}

[JsonSerializable(typeof(VaisseauPossederReponse[]))]
public partial class VaisseauPossederReponseContext: JsonSerializerContext;
