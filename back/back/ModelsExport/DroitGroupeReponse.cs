using back.Models;
using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class DroitGroupeReponse
{
     public required int Id { get; set; }

     public required string Nom { get; set; }

     public required bool PeutAcheterVaisseau { get; set; }
     public required bool PeutAcheterLogistiqueMateriel { get; set; }
     public required Droit[] ListeDroit { get; set; }
}

[JsonSerializable(typeof(DroitGroupeReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class DroitProgrammerReponseContext : JsonSerializerContext { }