using LiteDB;

namespace back.Models;

public sealed class Logistique
{
     [BsonId]
     public int Id { get; set; }

     [BsonRef]
     public LogistiqueType LogistiqueType { get; set; } = null!;

     [BsonRef]
     public TypeStockageLogistique TypeStockage { get; set; } = null!;
     public string Nom { get; set; } = null!;
     public int Prix { get; set; }
     public int Stock { get; set; }
     public int NbDetruit { get; set; }
     public int TailleUnitaireInventaire { get; set; }
     public bool IgnoreTypeStockage { get; set; }
     public bool EstKit { get; set; }
}
