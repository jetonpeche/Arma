using System.Text.Json.Serialization;
using LiteDB;

namespace back.Models;

public sealed class Formation
{
    [BsonId]
    public int Id { get; set; }

    public int Ordre { get; set; }

    public string NomComplet { get; set; } = null!;

    public string NomRaccourci { get; set; } = null!;

    public string Objectif { get; set; } = null!;

    public string ConditionReussite { get; set; } = null!;

    public string[] PersonnelleRequis { get; set; } = null!;

    public List<FormationEtape> ListeEtapeFormation { get; set; } = [];
}

public sealed class FormationEtape
{
    public int NumeroEtape { get; set; }
    public string Description { get; set; } = null!; 
}

[JsonSerializable(typeof(Formation[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class FormationContext: JsonSerializerContext;
