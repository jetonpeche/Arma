using LiteDB;

namespace back.Models;

public sealed class PlaneteConnecte
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public PlaneteOrigine PlaneteA { get; set; } = null!;

    [BsonRef]
    public PlaneteOrigine PlaneteB { get; set; } = null!;

    public string? Distance { get; set; }
}
