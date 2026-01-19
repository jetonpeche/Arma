using back.Models;

namespace back.ModelsImport;

public class VaisseauModifierRequete
{
     public required string Nom { get; set; }
     public int Prix { get; set; }
     public int Stock { get; set; }
     public required string Role { get; set; }
     public required string Vitesse { get; set; }
     public required string Blindage { get; set; }
     public string? CapaciteSpeciale { get; set; }
     public required EquipageVaisseau Equipage { get; set; }
     public required ArmementVaisseauModifierRequete[] ListeArmement { get; set; }
     public required StockageVaisseauModifierRequete[] ListeStockage { get; set; }
}
