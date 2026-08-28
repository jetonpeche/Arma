using LiteDB;

namespace back.Models;

public sealed class SystemeConnecte
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public Systeme SystemeA { get; set; } = null!;

    [BsonRef]
    public Systeme SystemeB { get; set; } = null!;

    public string? Distance { get; set; }
}
