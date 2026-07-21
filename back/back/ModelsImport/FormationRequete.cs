namespace back.ModelsImport;

public sealed class FormationRequete
{
    public required int Ordre { get; set; }

    public required string NomComplet { get; set; }

    public required string NomRaccourci { get; set; }

    public required string Objectif { get; set; }

    public required string ConditionReussite { get; set; }

    public required string[] PersonnelleRequis { get; set; }

    public required List<FormationEtapeRequete> ListeEtapeFormation { get; set; }
}

public sealed class FormationEtapeRequete
{
    public required int NumeroEtape { get; set; }
    public required string Description { get; set; }
}
