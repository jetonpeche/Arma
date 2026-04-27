using LiteDB;

namespace back.Models;

public sealed class MedaillePersonnage
{
     public Guid Id { get; set; }
     public int Quantite { get; set; }

     [BsonRef]
     public Medaille Medaille { get; set; } = null!;
}
