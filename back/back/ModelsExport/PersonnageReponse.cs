using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PersonnageReponse
{
     public required int Id { get; set; }
     public required string NomDiscord { get; set; }
     public required string Nom { get; set; }
     public required string Matricule { get; set; }
     public required string GroupeSanguin { get; set; }
     public string? EtatService { get; set; }
     public string? UrlPhotoIdentite { get; set; }
     public required int NbOperation { get; set; }
     public required int NbBootcamp { get; set; }
     public required int NbPointBoutique { get; set; }
     public required bool EstFormateur { get; set; }
     public required bool EstFormateurSpecialite { get; set; }
     public required bool FormationFaite { get; set; }

    public string? DateDerniereParticipation { get; set; }
    public required string DateCreation { get; set; }

    public GradeLegerReponse? Grade { get; set; }
    public PlaneteOrigineLegerReponse? PlaneteOrigine { get; set; }
    public SpecialiteLegerReponse? Specialite { get; set; }
}

[JsonSerializable(typeof(PersonnageReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PersonnageReponseContext: JsonSerializerContext { }
