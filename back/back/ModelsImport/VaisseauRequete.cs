using System.Text.Json.Serialization;
using back.Enums;
using back.Models;

namespace back.ModelsImport;

public sealed class VaisseauRequete
{
     public required string Nom { get; set; }
     public int Prix { get; set; }
     public required string Role { get; set; }
     public required string Vitesse { get; set; }
     public required string Blindage { get; set; }
     public string? CapaciteSpeciale { get; set; }
     public bool BloquerAchat { get; set; }
     public int RayonDeplacement { get; set; }
     public int RotationMaxDegres { get; set; }
     public required EquipageVaisseau Equipage { get; set; }
     public required ArmementVaisseauRequete[] ListeArmement { get; set; }
    public required StockageVaisseauRequete[] ListeStockage { get; set; }
    public required AeronefVaisseauRequete[] ListeAeronef { get; set; }
    public required ModuleVaisseauRequete[] ListeModule { get; set; }
    public required int[] ListeIdVaisseauEnfant { get; set; }
}

public sealed class ModuleVaisseauRequete
{
     public Guid? Id { get; set; }
    public string Nom { get; set; } = null!;
    public ETypeModuleVaisseau Type { get; set; }
    public EEmplacementModule Emplacement { get; set; }
    public int Quantite { get; set; }

    public int MalusPousseeAvantPourcentageParUnite { get; set; }
    public int MalusFreinagePourcentageParUnite { get; set; }

    public int MalusVirageGauchePourcentageParUnite { get; set; }
    public int MalusVirageDroitePourcentageParUnite { get; set; }
}

public sealed class AeronefVaisseauRequete
{
    public required int Id { get; set; }
    public required int Nombre { get; set; }
}

[JsonSerializable(typeof(VaisseauRequete))]
public partial class VaisseauRequeteContext: JsonSerializerContext;
