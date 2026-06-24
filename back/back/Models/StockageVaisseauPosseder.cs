using LiteDB;

namespace back.Models;

public sealed class StockageVaisseauPosseder
{
    [BsonId]
    public int  Id { get; set; }

    [BsonRef]
    public VaisseauPosseder VaisseauPosseder { get; set; } = null!;

    [BsonRef]
    public StockageVaisseau Stockage { get; set; } = null!;

    [BsonRef]
    public Logistique Logistique { get; set; } = null!;

    public int Quantite { get; set; }
}