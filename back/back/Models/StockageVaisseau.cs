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

    [BsonRef]
    public List<VaisseauStockageContenuDefaut> ListeContenuDefaut { get; set; } = [];
}

public sealed class VaisseauStockageContenuDefaut
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public Logistique Logistique { get; set; } = null!;
    public int Quantite { get; set; }
}
