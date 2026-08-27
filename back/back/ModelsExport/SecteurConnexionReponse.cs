using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class SecteurConnexionReponse
{
    public required int IdSecteurA { get; set; }

    public required int IdSecteurB { get; set; }

    public required string? Distance { get; set; }
}

public sealed class PlaneteConnexionReponse
{
    public required int IdPlaneteA { get; set; }

    public required int IdPlaneteB { get; set; }

    public required string? Distance { get; set; }
}

[JsonSerializable(typeof(List<SecteurConnexionReponse>))]
[JsonSerializable(typeof(List<PlaneteConnexionReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class SecteurPlaneteConnexionReponse: JsonSerializerContext;
