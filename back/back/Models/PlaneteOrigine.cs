using LiteDB;
using System.Text.Json.Serialization;

namespace back.Models;

public sealed class PlaneteOrigine
{
     [BsonId]
     public int Id { get; set; }
     public string Nom { get; set; } = null!;
     public string? Description { get; set; }
     public string? NomFichier { get; set; }
}
