using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class BoutiqueAcheterRequete
{
     public int IdBoutique { get; set; }
     public int IdBoutiquePrix { get; set; }
}

[JsonSerializable(typeof(BoutiqueAcheterRequete))]
public partial class BoutiqueAcheterRequeteContext: JsonSerializerContext { }