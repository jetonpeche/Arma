using System.Text.Json.Serialization;

namespace back.ModelsExport;

public class HistoriqueRapportOperationReponse
{
    public required int Id { get; set; }
    public required string NomAuteur { get; set; }

    public required string[] ListePersonnage { get; set; }

    public required string DateString { get; set; }
}

[JsonSerializable(typeof(HistoriqueRapportOperationReponse))]
[JsonSerializable(typeof(HistoriqueRapportOperationReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class HistoriqueRapportOperationReponseContext: JsonSerializerContext;
