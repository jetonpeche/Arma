using LiteDB;

namespace back.Models;

public sealed class VaisseauPosseder
{
     [BsonId]
     public int Id { get; set; }

     [BsonRef]
     public Vaisseau Vaisseau { get; set; } = null!;

     public string? NomVaisseau { get; set; }
     public string? NomCommandant { get; set; }
     public string? Information { get; set; }
     public bool EstDetruit { get; set; }
}
