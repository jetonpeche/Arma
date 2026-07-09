using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class PresetReponse
{
    public required string ServeurTS { get; set; }
    public required string MdpTS { get; set; }
    public required string MdpArma { get; set; }
    public required string CodeAmiSteam { get; set; }
    public required string AliasNomFichier { get; set; }
}

[JsonSerializable(typeof(PresetReponse))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class PresetReponseContext: JsonSerializerContext;