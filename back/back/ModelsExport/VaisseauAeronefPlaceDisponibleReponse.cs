using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class VaisseauAeronefPlaceDisponibleReponse
{
     public int Id { get; set; }
     public int NombrePlace { get; set; }
     public string? NomVaisseau { get; set; }
}

[JsonSerializable(typeof(VaisseauAeronefPlaceDisponibleReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class VaisseauAeronefPlaceDisponibleReponseContext : JsonSerializerContext;
