using LiteDB;

namespace back.Models;

public sealed class Orbat
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public Orbat? Parent { get; set; }

    public string? Titre { get; set; }

    public string? Indicatif { get; set; } = null!;

    public string? FrequenceRadio { get; set; }

    public string? NomImage { get; set; }

     public List<OrbatSlot> ListeSlot { get; set; } = [];
}

public sealed class OrbatSlot
{
     public Guid Id { get; set; }

     [BsonRef]
     public Grade? GradeRequis { get; set; }

     [BsonRef]
     public Personnage? Personnage { get; set; }

     public string Role { get; set; } = null!;

     public int OrdreAffichage { get; set; }

     public bool EstOptionnel { get; set; }
}
