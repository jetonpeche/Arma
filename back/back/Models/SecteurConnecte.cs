using LiteDB;

namespace back.Models;

public sealed class SecteurConnecte
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public Secteur SecteurA { get; set; } = null!;

    [BsonRef]
    public Secteur SecteurB { get; set; } = null!;

    public string? Distance { get; set; }
}
