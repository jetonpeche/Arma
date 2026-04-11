using LiteDB;

namespace back.Models;

public sealed class HistoriqueCampagne
{
     [BsonId]
     public int Id { get; set; }

     public string Titre { get; set; }  = null!;
     public string Texte { get; set; } = null!;

     public List<string> ListeNomFichier { get; set; } = [];
}
