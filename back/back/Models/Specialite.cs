using LiteDB;

namespace back.Models;

public sealed class Specialite
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public List<Specialite> ListeParent { get; set; } = [];

    [BsonRef]
    public Grade Grade { get; set; } = null!;
    public string Nom { get; set; } = null!;
    public string Raccourci { get; set; } = null!;
    public string Categorie { get; set; } = null!;
    public string? Description { get; set; }
    public bool EstNavy { get; set; }
    public string? NomImage { get; set; }
}
