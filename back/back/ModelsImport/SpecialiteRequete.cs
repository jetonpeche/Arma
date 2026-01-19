using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class SpecialiteRequete
{
    public required string Nom { get; set; }
    public string? Description { get; set; }
}

[JsonSerializable(typeof(SpecialiteRequete))]
public partial class SpecialiteRequeteContext: JsonSerializerContext { }
