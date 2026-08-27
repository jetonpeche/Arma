using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class PlaneteOrigineRequete
{
    public required int IdSecteur { get; set; }
    public required string Nom{ get; set; }
    public required string Description { get; set; }
    public required int Statut { get; set; }

    public required decimal PositionX { get; set; }
    public required decimal PositionY { get; set; }
}

[JsonSerializable(typeof(PlaneteOrigineRequete))]
public partial class PlaneteOrigineRequeteContext: JsonSerializerContext;
