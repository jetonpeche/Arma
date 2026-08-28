using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class SystemeConnexionReponse
{
    public required int IdSystemeA { get; set; }

    public required int IdSystemeB { get; set; }

    public required string? Distance { get; set; }
}

public sealed class PlaneteConnexionReponse
{
    public required int IdPlaneteA { get; set; }

    public required int IdPlaneteB { get; set; }

    public required string? Distance { get; set; }
}

public sealed class AsteroideConnexionReponse
{
     public required int IdAsteroideA { get; set; }

     public required int IdAsteroideB { get; set; }

     public required string? Distance { get; set; }
}

[JsonSerializable(typeof(List<SystemeConnexionReponse>))]
[JsonSerializable(typeof(List<PlaneteConnexionReponse>))]
[JsonSerializable(typeof(List<AsteroideConnexionReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class SystemePlaneteConnexionReponse: JsonSerializerContext;
