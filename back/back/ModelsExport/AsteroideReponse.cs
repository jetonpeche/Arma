using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class AsteroideReponse
{
     public int Id { get; set; }

     public int IdSysteme { get; set; }

     public string? Nom { get; set; } = null!;
     public string? Description { get; set; }
     public int Statut { get; set; }

     public decimal PositionX { get; set; }
     public decimal PositionY { get; set; }
}

[JsonSerializable(typeof(List<AsteroideReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class AsteroideReponseContext : JsonSerializerContext;