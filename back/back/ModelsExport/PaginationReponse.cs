using back.Models;
using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PaginationReponse<T>
{
     public required int Page { get; set; }
     public required int Total { get; set; }
     public required T[] Liste  { get; set; }
     public bool AUnePageSuivante => Total > (Page * 2);
}

[JsonSerializable(typeof(PaginationReponse<HistoriqueCampagneReponse>))]
[JsonSerializable(typeof(PaginationReponse<PlaneteOrigine>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PaginationReponseContext : JsonSerializerContext;
