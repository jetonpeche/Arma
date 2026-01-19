using back.Models;
using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class VaisseauRequete
{
     public required string Nom { get; set; }
     public int Prix { get; set; }
     public int Stock { get; set; }
     public required string Role { get; set; }
     public required string Vitesse { get; set; }
     public required string Blindage { get; set; }
     public string? CapaciteSpeciale { get; set; }
     public required EquipageVaisseau Equipage { get; set; }
     public required ArmementVaisseauRequete[] ListeArmement { get; set; }
     public required StockageVaisseauRequete[] ListeStockage { get; set; }
}

[JsonSerializable(typeof(VaisseauRequete))]
public partial class VaisseauRequeteContext: JsonSerializerContext { }
