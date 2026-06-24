using LiteDB;

namespace back.Models;

public sealed class SpecialiteSecondaire
{
    [BsonId]
    public int Id { get; set; }
    public string Nom { get; set; } = null!;
    public string? Description { get; set; }
}
