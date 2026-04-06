using LiteDB;

namespace back.Models;

public sealed class Medaille
{
     [BsonId]
     public int Id { get; set; }
     public string Nom { get; set; } = null!;
     public string Description { get; set; } = null!;
     public string? NomFichier { get; set; }
     public int NbPoint { get; set; }

     /// <summary>
     /// 0 => Personnelle, 1 => services, 2 => campagne
     /// </summary>
     public int Groupe { get; set; }
}
