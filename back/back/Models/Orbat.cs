using LiteDB;

namespace back.Models;

public sealed class Orbat
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public Orbat? Parent { get; set; }

    public string? Titre { get; set; }

    public string Indicatif { get; set; } = null!;

    public string? FrequenceRadio { get; set; }

    public string? NomImage { get; set; }
}
