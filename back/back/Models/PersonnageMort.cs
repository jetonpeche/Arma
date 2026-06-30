using LiteDB;

namespace back.Models;

public sealed class PersonnageMort
{
    [BsonId]
    public int Id { get; set; }

    public string Nom { get; set; } = null!;

    public string DateNaissance { get; set; } = null!;
    public string DateMort { get; set; } = null!;

    public int NbOperation { get; set; }

    public string? ElogeFunebre { get; set; }

    public string? NomGrade { get; set; }

    public string? NomSpecialite { get; set; }
}