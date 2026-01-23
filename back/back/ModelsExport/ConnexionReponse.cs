using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class ConnexionReponse
{
     public required string Nom { get; set; }
     public required string Jwt { get; set; }
     public required int NbPointBoutique { get; set; }
     public required int NbPointBanque { get; set; }
}

[JsonSerializable(typeof(ConnexionReponse))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class ConnexionReponseContext: JsonSerializerContext { }
