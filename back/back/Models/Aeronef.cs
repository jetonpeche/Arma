using LiteDB;

namespace back.Models;

public sealed class Aeronef
{
    [BsonId]
    public int Id { get; set; }

    public int Prix { get; set; }

    public string Nom { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string? Description { get; set; }
}
