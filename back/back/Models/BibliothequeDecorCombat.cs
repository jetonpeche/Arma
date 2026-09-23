using LiteDB;

namespace back.Models;

public sealed class BibliothequeDecorCombat
{
    [BsonId]
    public int Id { get; set; }

    public string? NomRecherche { get; set; }

    public string NomImage { get; set; } = null!;
}
