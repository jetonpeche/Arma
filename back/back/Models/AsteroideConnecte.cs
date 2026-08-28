using LiteDB;

namespace back.Models;

public sealed class AsteroideConnecte
{
     [BsonId]
     public int Id { get; set; }

     [BsonRef]
     public Asteroide AsteroideA { get; set; } = null!;

     [BsonRef]
     public Asteroide AsteroideB { get; set; } = null!;

     public string? Distance { get; set; }
}
