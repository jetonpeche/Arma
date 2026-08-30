using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class SecteurReponse
{
     public int Id { get; set; }

     public required string Nom { get; set; }

     public required string CouleurHexa { get; set; }

     public List<SecteurZoneCarteReponse> ListePosition { get; set; } = [];
}

public sealed class SecteurZoneCarteReponse
{
     public required int PositionX { get; set; }
     public required int PositionY { get; set; }
}

[JsonSerializable(typeof(List<SecteurReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class SecteurReponseContext : JsonSerializerContext;
