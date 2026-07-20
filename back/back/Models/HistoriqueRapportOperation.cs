using LiteDB;

namespace back.Models;

public sealed class HistoriqueRapportOperation
{
    [BsonId]
    public int Id { get; set; }

    public string NomAuteur { get; set; } = null!;

    public string[] ListePersonnage { get; set; } = [];

    public DateTime DateCreation { get; set; }
}