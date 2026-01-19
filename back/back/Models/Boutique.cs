using LiteDB;

namespace back.Models;

public sealed class Boutique
{
    [BsonId]
    public int Id { get; set; }
     public string Titre { get; set; } = null!;
     public string? NomFichier { get; set; }
    public string? Description { get; set; }

     [BsonRef]
     public List<BoutiquePrix> ListePrix { get; set; } = [];
}
