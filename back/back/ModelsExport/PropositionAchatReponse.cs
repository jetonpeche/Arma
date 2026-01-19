using back.Models;
using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PropositionAchatReponse
{
     public required int Id { get; set; }
     public required string Auteur { get; set; }
     public required ObjetProposer[] Liste { get; set; }
}

[JsonSerializable(typeof(PropositionAchatReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PropositionAchatReponseContext: JsonSerializerContext { }
