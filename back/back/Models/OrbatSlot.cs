using LiteDB;

namespace back.Models;

public sealed class OrbatSlot
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public Orbat Orbat { get; set; } = null!;

    [BsonRef]
    public Grade? GradeRequis { get; set; }

    [BsonRef]
    public Personnage? Personnage { get; set; }

    public string Role { get; set; } = null!;

    public int OrdreAffichage { get; set; }

    public bool EstOptionnel { get; set; }
}
