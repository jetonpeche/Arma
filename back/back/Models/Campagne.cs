using LiteDB;

namespace back.Models;

public sealed class Campagne
{
    [BsonId]
    public int Id { get; set; }

    public string Nom { get; set; } = null!;
    public string? Resumer { get; set; }
    public string? IntervalDate { get; set; }
}
