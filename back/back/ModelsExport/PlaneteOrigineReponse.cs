using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PlaneteOrigineReponse
{
    public int Id { get; set; }

    public int? IdSecteur { get; set; }

    public string Nom { get; set; } = null!;
    public string? Description { get; set; }
    public string? NomFichier { get; set; }
    public int Statut { get; set; }

    public decimal PositionX { get; set; }
    public decimal PositionY { get; set; }
}

[JsonSerializable(typeof(PlaneteOrigineReponse))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PlaneteOrigineReponseContext: JsonSerializerContext;
