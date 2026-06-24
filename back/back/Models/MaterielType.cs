using LiteDB;

namespace back.Models;

public sealed class MaterielType
{
     [BsonId]
     public int Id { get; set; }
     public string Nom { get; set; } = null!;
}
