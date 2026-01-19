using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class MaterielRequete
{
     public required int IdTypeMateriel { get; set; }
     public required string Nom { get; set; }
     public required string? Description { get; set; }
     public required int Prix { get; set; }
     public required int Stock { get; set; }
     public required int NbPlacer { get; set; }
     public required int NbDetruit { get; set; }
}

[JsonSerializable(typeof(MaterielRequete))]
public partial class MaterielRequeteContext: JsonSerializerContext { }
