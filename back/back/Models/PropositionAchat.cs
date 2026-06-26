using System.Text.Json.Serialization;
using back.Enums;
using LiteDB;

namespace back.Models;

public sealed class PropositionAchat
{
     [BsonId]
     public int Id { get; set; }

     [BsonRef]
     public Personnage Personnage { get; set; } = null!;
     public List<ObjetProposer> Liste { get; set; } = [];
}

public sealed class ObjetProposer
{
    public int IdType { get; set; }
    public int? IdVaisseau { get; set; }
    public int? IdStockage { get; set; }
    public ETypeObjetProposer Type { get; set; }
    public string Nom { get; set; } = null!;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? NomVaisseau { get; set; }
    public int PrixUnitaire { get; set; }
     public int Quantite { get; set; }
}
