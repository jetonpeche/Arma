using System.Text.Json.Serialization;
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
     public required EquipageVaisseau Equipage { get; set; }
     public required ArmementVaisseauRequete[] ListeArmement { get; set; }
    public required StockageVaisseauRequete[] ListeStockage { get; set; }
    public required AeronefVaisseauRequete[] ListeAeronef { get; set; }
    public required int[] ListeIdVaisseauEnfant { get; set; }
}

public sealed class AeronefVaisseauRequete
{
    public required int Id { get; set; }
    public required int Nombre { get; set; }
}

[JsonSerializable(typeof(VaisseauRequete))]
public partial class VaisseauRequeteContext: JsonSerializerContext;
