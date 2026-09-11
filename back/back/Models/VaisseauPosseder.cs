using back.Enums;
using LiteDB;

namespace back.Models;

public sealed class VaisseauPosseder
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public Vaisseau Vaisseau { get; set; } = null!;

    [BsonRef]
    public List<StockageVaisseauPosseder> ListeStockage { get; set; } = [];

    public List<ArmementVaisseauPosseder> ListeCapaciteArmement { get; set; } = [];

    public List<AeronefVaisseauPosseder> ListeAeronef { get; set; } = [];

    public List<ModuleVaisseauPosseder> ListeModule { get; set; } = [];

    public EquipageVaisseau? Equipage { get; set; }

    public int NombreBataillesSurvecue { get; set; }
    public int NombreVaisseauDetruit { get; set; }

    public string? NomVaisseau { get; set; }
    public string? NomCommandant { get; set; }
    public string? Information { get; set; }
    public bool EstEpave { get; set; }
    public bool EstPnj { get; set; }
    public int IdUtilisateur { get; set; }
}

public sealed class ModuleVaisseauPosseder
{
    public Guid IdModuleDefaut { get; set; }
    public EStatutModuleVaisseau Statut { get; set; }
}

public sealed class AeronefVaisseauPosseder
{
    [BsonRef]
    public Aeronef Aeronef { get; set; } = null!;
    public int NombreDetruit { get; set; }
    public int NombreSortie {get; set; }
}

public sealed class ArmementVaisseauPosseder
{
    public Guid IdArmement { get; set; }
    public int NombreDetruit { get; set; }
    public int NombreUtiliser { get; set; }
}
