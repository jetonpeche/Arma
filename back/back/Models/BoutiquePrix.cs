using LiteDB;

namespace back.Models;

public sealed class BoutiquePrix
{
     [BsonId]
     public int Id { get; set; }

     [BsonRef]
     public Boutique Boutique { get; set; } = null;

     [BsonRef]
     public List<Personnage> ListePersonnage { get; set; } = [];

     public string Nom { get; set; } = null!;
     public int Ordre { get; set; }
     public int Prix { get; set; }
}
