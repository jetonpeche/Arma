using back.Enums;
using LiteDB;

namespace back.Models;

public sealed class Vaisseau
{
     [BsonId]
     public int Id { get; set; }
     public string Nom { get; set; } = null!;
     public int Prix { get; set; }
     public int Stock { get; set; }
     public string Role { get; set; } = null!;
     public string? CapaciteSpeciale { get; set; }
     public string? NomFichier { get; set; }
     public string? NomFichierSprite { get; set; }
    public bool BloquerAchat { get; set; }
    public bool EstSupprimer { get; set; }

    public List<ArmementVaisseau> ListeArmement { get; set; } = [];

    public List<ModuleVaisseauDefaut> ListeModuleDefaut { get; set; } = [];

    [BsonRef]
     public List<StockageVaisseau> ListeStockage { get; set; } = [];

     [BsonRef]
    public List<Vaisseau> ListeVaisseauEnPlus { get; set; } = [];

    public List<VaisseauAeronef> ListeAeronef { get; set; } = [];

    public EquipageVaisseau Equipage { get; set; } = null!;

    public string Vitesse { get; set; } = null!;

     public int RayonDeplacement { get; set; }
     public int RotationMaxDegres { get; set; }
     public string Blindage { get; set; } = null!;
}

public sealed class ModuleVaisseauDefaut
{
     public Guid Id { get; set; }
     public string Nom { get; set; } = null!;
     public ETypeModuleVaisseau Type { get; set; }
     public int ImpactVitessePourcentage { get; set; }
     public int ImpactRotationPourcentage { get; set; }
}

public sealed class VaisseauAeronef
{
     [BsonRef]
    public Aeronef Aeronef { get; set; } = null!;
    public int Nombre { get; set; }
}
