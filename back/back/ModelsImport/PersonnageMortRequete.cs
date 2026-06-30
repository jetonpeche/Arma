namespace back.ModelsImport;

public sealed class PersonnageMortRequete
{
    public required int IdPlaneteOrigine { get; set; }
    public required int IdSpecialite { get; set; }
    public required string Nom { get; set; }
    public required string Matricule { get; set; }
    public required string GroupeSanguin { get; set; }
    public required string DateNaissance { get; set; }
    public required string DateMort { get; set; }
    public string? EtatService { get; set; }
    public bool EstFormateur { get; set; }
    public bool EstFormateurSpecialite { get; set; }
    public bool FormationFaite { get; set; }
    public string? ElogeFunebre { get; set; }
}
