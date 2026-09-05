using LiteDB;

namespace back.Models;

public sealed class PlaneteOrigine
{
     [BsonId]
    public int Id { get; set; }

     [BsonRef]
     public Systeme Systeme { get; set; } = null!;

     public string Nom { get; set; } = null!;
     public string? Description { get; set; }
     public string? NomFichier { get; set; }

     /// <summary>
     /// Statut de l'astre (Vitrifié, en guerre...)
     /// </summary>
     public int Statut { get; set; }

     /// <summary>
     /// A qui appartient l'astre (UNSC, covenante...)
     /// </summary>
     public int Appartenance { get; set; }

     /// <summary>
     /// Type d'astre
     /// Lune, planete, asteroide, etoile
     /// </summary>
     public int Type { get; set; }

     public int Densite { get; set; }
     public bool EstPlaneteOrigine { get; set; }

    public decimal PositionX { get; set; }
    public decimal PositionY { get; set; }

     public List<Orbite> ListeOrbite { get; set; } = [];
}

public sealed class Orbite
{
     public decimal OrbiteDecalageX { get; set; }
     public decimal OrbiteDecalageY { get; set; }
     public decimal OrbiteX { get; set; }
     public decimal OrbiteY { get; set; }
     public decimal OrbiteAngle { get; set; }
}
