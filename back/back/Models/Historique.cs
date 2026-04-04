using LiteDB;

namespace back.Models;

public sealed class Historique
{
     [BsonId]
     public int Id { get; set; }
     public string Information { get; set; } = null!;
     public DateTime Date { get; set; }
}
