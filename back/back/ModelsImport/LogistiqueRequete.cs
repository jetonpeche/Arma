using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class LogistiqueRequete
{
     public int IdTypeStockage { get; set; }
     public int IdType { get; set; }
     public string Nom { get; set; } = null!;
     public int Prix { get; set; }
     public int Stock { get; set; }
     public int NbDetruit { get; set; }
     public int TailleUnitaireInventaire { get; set; }
     public bool IgnoreTypeStockage { get; set; }
     public bool EstKit { get; set; }
}

[JsonSerializable(typeof(LogistiqueRequete))]
public partial class LogistiqueRequeteContext: JsonSerializerContext { }
