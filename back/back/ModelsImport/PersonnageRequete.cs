using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class PersonnageRequete
{
     public int IdGrade { get; set; }
     public required int IdPlaneteOrigine { get; set; }
     public required int? IdSpecialite { get; set; }
     public int NbPointBoutique { get; set; }

     public string Login { get; set; } = null!;
     public string Mdp { get; set; } = null!;
     public required string NomDiscord { get; set; }
     public required string Nom { get; set; }
     public required string Matricule { get; set; }
     public required string GroupeSanguin { get; set; }
     public string? EtatService { get; set; }
     public bool FormationFaite { get; set; }
}

[JsonSerializable(typeof(PersonnageRequete))]
public partial class PersonnageRequeteContext: JsonSerializerContext { }
