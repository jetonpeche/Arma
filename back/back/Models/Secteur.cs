using LiteDB;

namespace back.Models;

public sealed class Secteur
{
     [BsonId]
     public int Id { get; set; }

     public string Nom { get; set; } = null!;

     public string CouleurHexa { get; set; } = null!;
}

public sealed class SecteurZoneCarte
{
     [BsonId]
     public int Id { get; set; }

     public Secteur Secteur { get; set; } = null!;

     public int PositionX { get; set; }

     public int PositionY { get; set; }
}
