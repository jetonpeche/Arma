using LiteDB;

namespace back.Models;

/// <summary>
///  Parametrer les droits des comptes sur l'application
/// </summary>
public sealed class DroitGroupe
{
     [BsonId]
     public int Id { get; set; }

     public string Nom { get; set; } = null!;

     public bool PeutAcheterVaisseau { get; set; }
     public bool PeutAcheterLogistiqueMateriel { get; set; }

     /// <summary>
     /// Droit pour chaque Route du groupe de route
     /// </summary>
     public List<Droit> ListeDroit { get; set; } = [];
}

public sealed class Droit
{
     public string RouteGroupe { get; set; } = null!;
     public bool PeutLire { get; set; }
     public bool PeutEcrire { get; set; }
     public bool PeutSupprimer { get; set; }
}
