namespace back.ModelsImport;

public class StockageVaisseauRequete
{
     public int IdTypeStockage { get; set; }
     public string Nom { get; set; } = null!;
     public int Taille { get; set; }
}

public sealed class StockageVaisseauModifierRequete: StockageVaisseauRequete
{
     public int? Id { get; set; }
}
