using LiteDB;

namespace back.Models;

public sealed class PersonnageSecondaire
{
    [BsonId]
    public int Id { get; set; }
    public string Nom { get; set; } = null!;
    public string? EtatService { get; set; }
    public bool EstFormateur { get; set; }
    public string? NomFichierPhotoIdentite { get; set; }

    [BsonRef]
    public SpecialiteSecondaire SpecialiteSecondaire { get; set; } = null!;

    [BsonRef]
    public EtatCandidature EtatCandidature { get; set; } = null!;
}
