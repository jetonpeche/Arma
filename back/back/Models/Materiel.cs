using LiteDB;

namespace back.Models;

public sealed class Materiel
{
     [BsonId]
     public int Id { get; set; }

     [BsonRef]
     public MaterielType Type { get; set; } = null!;
     public string Nom { get; set; } = null!;
     public string? Description { get; set; }
     public int Prix { get; set; }
     public int Stock { get; set; }
     public int NbPlacer { get; set; }
     public int NbDetruit { get; set; }
}
