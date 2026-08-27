namespace back.ModelsImport;

public sealed class HistoriqueCampagneRequete
{
     public required int IdCampagne {get; set; }
     public required string Date { get; set; }
     public required string Titre { get; set; }
     public required string Texte { get; set; }
     public required string CodeOperation { get; set; }
     public required int IdPlanete { get; set; }
}
