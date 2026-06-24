using LiteDB;

namespace back.Models;

public sealed class LogistiqueType
{
     [BsonId]
     public int Id { get; set; }
     public string Nom { get; set; } = null!;
}
