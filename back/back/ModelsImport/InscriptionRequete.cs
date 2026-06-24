namespace back.ModelsImport;

public sealed class InscriptionRequete
{
     public required int IdPlaneteOrigine { get; set; }
     public required int? IdSpecialite { get; set; }

     public string Login { get; set; } = null!;
     public string Mdp { get; set; } = null!;
     public required string NomDiscord { get; set; }
     public required string Nom { get; set; }
     public required string Matricule { get; set; }
     public required string GroupeSanguin { get; set; }
     public required string DateNaissance { get; set; }
     public string? EtatService { get; set; }
}
