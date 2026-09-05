using back.Models;
using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PlaneteOrigineReponse
{
    public int Id { get; set; }

    public int IdSysteme { get; set; }

    public string Nom { get; set; } = null!;
    public string? Description { get; set; }
    public string? NomFichier { get; set; }
    public int Statut { get; set; }
     public int Appartenance { get; set; }
     public int Type { get; set; }
     public int Densite { get; set; }
     public bool EstPlaneteOrigine { get; set; }
     public List<Orbite> ListeOrbite { get; set; } = [];

    public decimal PositionX { get; set; }
    public decimal PositionY { get; set; }
}

[JsonSerializable(typeof(List<PlaneteOrigineReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PlaneteOrigineReponseContext: JsonSerializerContext;
