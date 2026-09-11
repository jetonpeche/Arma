using System.Text.Json.Serialization;
using back.Enums;

namespace back.ModelsExport;

public class VaisseauPossederReponse
{
    public required int Id { get; set; }
    public required int NombreBataillesSurvecue { get; set; }
    public required int NombreVaisseauDetruit { get; set; }
    public required int RayonDeplacement { get; set; }
    public required int RotationMaxDegres { get; set; }
    public required string? NomCommandant { get; set; }
    public required string NomVaisseau { get; set; }
    public required string? NomVaisseauAlias { get; set; }
    public required string? Information { get; set; }
    public required bool EstEpave { get; set; }
    public required string? NomFichierSprite { get; set; }
    public required EquipageVaisseauPossederReponse Equipage { get; set; }
    public required ArmementVaisseauPossederReponse[] ListeArmement { get; set; }
    public required StockageVaisseauPossederReponse[] ListeStockage { get; set; }
    public required AeronefVaisseauPossederReponse[] ListeAeronef { get; set; }
    public required ModuleVaisseauPossederReponse[] ListeModule { get; set; }
}

public sealed class EquipageVaisseauPossederReponse
{
    public required int NbPlacePassagerMax { get; set; }
    public required int NbPlacePassager { get; set; }
    public required int NbPlaceMarinesMax { get; set; }
    public required int NbPlaceMarines { get; set; }
}

public sealed class AeronefVaisseauPossederReponse
{
    public required int Id { get; set; }
    public required string Nom { get; set; }
    public required string? Description { get; set; }
    public required int NombreMax { get; set; }
    public required int NombreDisponible { get; set; }
    public required int NombreSortie { get; set; }
    public required int NombreDetruit { get; set; }
}

public sealed class ArmementVaisseauPossederReponse
{
    public required Guid Id { get; set; }
    public required string Nom { get; set; } = null!;
    public required string? Information { get; set; }
    public required int NombreMax { get; set; }
    public required int NombreDisponible { get; set; }
    public required int NombreDetruit { get; set; }
    public required int NombreUtiliser { get; set; }
     public required bool MunitionInfini { get; set; }
    public required bool EstUsageUnique { get; set; }
    public required int NbTourReload { get; set; }
    public required int NbNombreReloadParNbTour { get; set; }

    public required float AngleOffsetDegres { get; set; }
    public required float AngleOuvertureDegres { get; set; }
    public required float PorteeMinimale { get; set; }
    public required float PorteeMaximale { get; set; }
}

public sealed class StockageVaisseauPossederReponse
{
    public required int Id { get; set; }
    public int IdTypeStockage { get; set; }
    public required string NomTypeStockage { get; set; }
    public required string Nom { get; set; }
    public required int Taille { get; set; }
    public required int Occuper { get; set; }
    public int Disponible => Taille - Occuper;
}

public sealed class ModuleVaisseauPossederReponse
{
    public required Guid Id { get; set; }
    public required string Nom { get; set; }
    public ETypeModuleVaisseau Type { get; set; }
    public EStatutModuleVaisseau Statut { get; set; }
    public int ImpactVitessePourcentage { get; set; }
    public int ImpactRotationPourcentage { get; set; }
}

[JsonSerializable(typeof(List<VaisseauPossederReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class VaisseauPossederReponseContext: JsonSerializerContext;
