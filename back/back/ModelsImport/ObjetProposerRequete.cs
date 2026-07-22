using System.Text.Json.Serialization;
using back.Enums;

namespace back.ModelsImport;

public sealed class ObjetProposerRequete
{
    public int IdType { get; set; }
    public int? IdVaisseau { get; set; }
    public int? IdStockage { get; set; }
    public ETypeObjetProposer Type { get; set; }
     public int Quantite { get; set; }

     [JsonIgnore]
     public int PrixUnitaire { get; set; }

     [JsonIgnore]
    public string Nom { get; set; } = null!;

    [JsonIgnore]
    public string? NomVaisseau { get; set; }

    [JsonIgnore]
    public string? NomStockage { get; set; }

    /// <summary>
    /// Utiliser pour le service Proposition achat service
    /// </summary>
    /// <value></value>
    [JsonIgnore]
    public int? IdStockagePosseder { get; set; }
}
