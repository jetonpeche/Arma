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

     public List<ArmementVaisseau> ListeArmement { get; set; } = [];

     [BsonRef]
     public List<StockageVaisseau> ListeStockage { get; set; } = [];

     public EquipageVaisseau Equipage { get; set; } = null!;

     public string Vitesse { get; set; } = null!;
     public string Blindage { get; set; } = null!;
}
