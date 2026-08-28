using LiteDB;

namespace back.Models;

public sealed class Asteroide
{
     [BsonId]
     public int Id { get; set; }

     [BsonRef]
     public Systeme Systeme { get; set; } = null!;

     public string? Nom { get; set; }
     public string? Description { get; set; }
     public int Statut { get; set; }

     public decimal PositionX { get; set; }
     public decimal PositionY { get; set; }
}
