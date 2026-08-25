using LiteDB;

namespace back.Models;

public sealed class HistoriqueCampagne
{
     [BsonId]
     public int Id { get; set; }

     public string Titre { get; set; }  = null!;
     public string Date { get; set; } = null!;
     public string Texte { get; set; } = null!;
    public string CodeOperation { get; set; } = null!;

    [BsonRef]
    public PlaneteOrigine? Planete { get; set; }

     public List<string> ListeNomFichier { get; set; } = [];
}
