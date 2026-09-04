using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class PlaneteOrigineRequete
{
    public required int IdSysteme { get; set; }
    public required string Nom{ get; set; }
    public required string Description { get; set; }
    public required int Statut { get; set; }
    public required int Type { get; set; }
    public required int Appartenance { get; set; }
     public required bool EstPlaneteOrigine { get; set; }

    public required decimal PositionX { get; set; }
    public required decimal PositionY { get; set; }
}

[JsonSerializable(typeof(PlaneteOrigineRequete))]
public partial class PlaneteOrigineRequeteContext: JsonSerializerContext;
