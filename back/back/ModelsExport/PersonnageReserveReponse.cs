using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PersonnageReserveReponse
{
     public int Id { get; set; }
     public required string Nom { get; set; }
     public required string? NomGrade { get; set; }
     public required string? NomSpecialite { get; set; }
     public required string? DateDerniereParticipation { get; set; }
}

[JsonSerializable(typeof(PersonnageReserveReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PersonnageReserveReponseContext : JsonSerializerContext;
