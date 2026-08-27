namespace back.ModelsImport;

public sealed class PlaneteConnexionRequete
{
    public int IdPlaneteA { get; set; }
    public int IdPlaneteB { get; set; }
    public string? Distance { get; set; }
}

public sealed class PlaneteConnexionSupprimerRequete
{
    public int IdPlaneteA { get; set; }
    public int IdPlaneteB { get; set; }
}
