using LiteDB;

namespace back.Models;

public sealed class StockageVaisseau
{
     [BsonId]
     public int Id { get; set; }
     public string Nom { get; set; } = null!;
     public int Taille { get; set; }

     [BsonRef]
     public Vaisseau Vaisseau { get; set; } = null!;

     [BsonRef]
     public TypeStockageLogistique TypeStockage { get; set; } = null!;
}
