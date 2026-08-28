using LiteDB;

namespace back.Models;

public sealed class PlaneteOrigine
{
     [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public Systeme? Systeme { get; set; }

    public string Nom { get; set; } = null!;
     public string? Description { get; set; }
    public string? NomFichier { get; set; }
    public int Statut { get; set; }

    public decimal PositionX { get; set; }
    public decimal PositionY { get; set; }
}
