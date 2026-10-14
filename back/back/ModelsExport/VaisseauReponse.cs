using System.Text.Json.Serialization;
using back.Enums;

namespace back.ModelsExport;

public sealed class VaisseauReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
     public required int Prix { get; set; }
     public required int Stock { get; set; }
     public required string Role { get; set; }
     public required string? NomFichier { get; set; }
     public required string? NomFichierSprite { get; set; }
     public required string? CapaciteSpeciale { get; set; }
     public required bool BloquerAchat { get; set; }

     public required StockageVaisseauReponse[] ListeStockage { get; set; }
     public required ArmementVaisseauReponse[] ListeArmement { get; set; }
     public required VaisseauLegerReponse[] ListeVaisseauEnfant { get; set; }
     public required VaisseauAeronefReponse[] ListeAeronef { get; set; }
     public required VaisseauModuleReponse[] ListeModule { get; set; }
     public required EquipageVaisseauReponse Equipage { get; set; }

     public string Vitesse { get; set; } = null!;
     public string Blindage { get; set; } = null!;
     public required int RayonDeplacement { get; set; }
     public required int RotationMaxDegres { get; set; }
}

public sealed class VaisseauModuleReponse
{
     public Guid Id { get; set; }
    public string Nom { get; set; } = null!;
    public ETypeModuleVaisseau Type { get; set; }
    public EEmplacementModule Emplacement { get; set; }
    public int Quantite { get; set; }

    public int MalusPousseeAvantPourcentageParUnite { get; set; }
    public int MalusFreinagePourcentageParUnite { get; set; }

    public int MalusVirageGauchePourcentageParUnite { get; set; }
    public int MalusVirageDroitePourcentageParUnite { get; set; }
}

public sealed class VaisseauAeronefReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
     public required int Nombre { get; set; }
}

public sealed class StockageVaisseauReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
     public required int Taille { get; set; }

    public required TypeStockageLogistiqueReponse TypeStockage { get; set; }

    [JsonPropertyName("contenuParDefaut")]
    public required StockageVaisseauContenuDefautReponse[] ListeContenuDefaut { get; set; }
}

public sealed class StockageVaisseauContenuDefautReponse
{
    public required int IdLogistique { get; set; }
    public required int Quantite { get; set; }
    public required string Nom { get; set; }
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
     public required bool MunitionInfini { get; set; }
     public required bool EstUsageUnique { get; set; }
    public required int NbTourReload { get; set; }
     public int NbNombreReloadParNbTour { get; set; }
}

[JsonSerializable(typeof(VaisseauReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class VaisseauReponseContext : JsonSerializerContext;
