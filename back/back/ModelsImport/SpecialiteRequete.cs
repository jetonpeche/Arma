using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class SpecialiteRequete
{
    public int[] ListeIdParent { get; set; } = [];
    public required int IdGrade { get; set; }
    public required string Raccourci { get; set; }
    public required string Nom { get; set; }
    public string? Categorie { get; set; }
    public string? Description { get; set; }
    public bool EstNavy { get; set; }
}

[JsonSerializable(typeof(SpecialiteRequete))]
public partial class SpecialiteRequeteContext: JsonSerializerContext { }
