using System.Text.Json.Serialization;

namespace back.ModelsImport;

public class StockageVaisseauRequete
{
     public int IdTypeStockage { get; set; }
     public string Nom { get; set; } = null!;
    public int Taille { get; set; }

    [JsonPropertyName("contenuParDefaut")]
    public required StockageVaisseauContenuDefautRequete[] ListeContenuDefaut { get; set; }
}

public sealed class StockageVaisseauModifierRequete: StockageVaisseauRequete
{
     public int? Id { get; set; }
}

public sealed class StockageVaisseauContenuDefautRequete
{
    public required int IdLogistique { get; set; }
    public required int Quantite { get; set; }
}
