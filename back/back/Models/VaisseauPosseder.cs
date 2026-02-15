using LiteDB;

namespace back.Models;

public sealed class VaisseauPosseder
{
     [BsonId]
     public int Id { get; set; }

     [BsonRef]
     public Vaisseau Vaisseau { get; set; } = null!;

     public string? Information { get; set; }
}
