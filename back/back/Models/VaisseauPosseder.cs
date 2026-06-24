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

    public string? NomVaisseau { get; set; }
    public string? NomCommandant { get; set; }
    public string? Information { get; set; }
    public bool EstDetruit { get; set; }
}

public sealed class ArmementVaisseauPosseder
{
    public Guid IdArmement { get; set; }
    public int MunitionDisponible { get; set; }
    public int NombreDisponible { get; set; }
}
