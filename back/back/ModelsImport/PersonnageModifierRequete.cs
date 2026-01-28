namespace back.ModelsImport;

public sealed class PersonnageModifierRequete
{
     public int IdGrade { get; set; }
     public required int IdPlaneteOrigine { get; set; }
     public required int? IdSpecialite { get; set; }
     public required int IdDroitGroupe { get; set; }
     public required int NbOperation { get; set; }
     public required int NbBootcamp { get; set; }
     public int NbPointBoutique { get; set; }
     public required string NomDiscord { get; set; }
     public required string Nom { get; set; }
     public required string Matricule { get; set; }
     public required string GroupeSanguin { get; set; }
     public string? EtatService { get; set; }
     public bool EstFormateur { get; set; }
     public bool EstFormateurSpecialite { get; set; }
     public bool FormationFaite { get; set; }
}
