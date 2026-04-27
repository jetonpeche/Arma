using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class IdValeurReponse
{
     public int Id { get; set; }
     public required string Nom { get; set; }
}

[JsonSerializable(typeof(List<IdValeurReponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class IdValeurReponseContext : JsonSerializerContext;
