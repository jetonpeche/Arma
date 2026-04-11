using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class HistoriqueCampagneReponse
{
     public int Id { get; set; }
     public required string Texte { get; set; }
     public required string[]  ListeUrlImage { get; set; }
}
