using LiteDB;

namespace back.Models;

public sealed class Status
{
    [BsonId]
    public int Id { get; set; }
    public string Nom { get; set; } = null!;
}
