using LiteDB;

namespace back.Models;

public sealed class HistoriqueAchat
{
     [BsonId]
     public int Id { get; set; }
     public string Information { get; set; } = null!;
     public DateTime Date { get; set; }
}
