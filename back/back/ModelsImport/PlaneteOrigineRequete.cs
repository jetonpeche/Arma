using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class PlaneteOrigineRequete
{
    public required string Nom{ get; set; }
}

[JsonSerializable(typeof(PlaneteOrigineRequete))]
public partial class PlaneteOrigineRequeteContext: JsonSerializerContext { }
