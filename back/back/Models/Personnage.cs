using LiteDB;

namespace back.Models;

public sealed class Personnage
{
    [BsonId]
    public int Id { get; set; }

    [BsonRef]
    public Grade? Grade { get; set; }

    [BsonRef]
    public PlaneteOrigine? PlaneteOrigine { get; set; }

    [BsonRef]
    public Status Status { get; set; } = null!;

    [BsonRef]
    public PersonnageSecondaire? PersonnageSecondaire { get; set; }

    [BsonRef]
    public Specialite? Specialite { get; set; }

     [BsonRef]
     public List<BoutiquePrix> ListeBoutiquePrix { get; set; } = [];

     public string NomDiscord { get; set; } = null!;
    public string Nom { get; set; } = null!;
    public string Matricule { get; set; } = null!;
    public string GroupeSanguin { get; set; } = null!;
    public string? EtatService { get; set; }
    public string? NomFichierPhotoIdentite { get; set; }
    public int NbOperation { get; set; }
    public int NbBootcamp { get; set; }
    public int NbPointBoutique { get; set; }

    public bool EstFormateur { get; set; }
    public bool EstFormateurSpecialite { get; set; }
    public bool FormationFaite { get; set; }

    public DateTime? DateDerniereParticipation { get; set; }
    public DateTime DateCreation { get; set; }
}
