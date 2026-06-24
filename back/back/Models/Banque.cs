using LiteDB;

namespace back.Models;

public sealed class Banque
{
     [BsonId]
     public int Id { get; set; }
     public int Argent { get; set; }
}
