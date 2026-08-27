using LiteDB;

namespace back.Models;

public sealed class Secteur
{
    [BsonId]
    public int Id { get; set; }
    public string Nom { get; set; } = null!;
    public string? Description { get; set; }

    public decimal PositionX { get; set; }
    public decimal PositionY { get; set; }
}
