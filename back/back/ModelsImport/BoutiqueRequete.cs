namespace back.ModelsImport;

public sealed class BoutiqueRequete
{
     public required string Titre { get; set; }
     public string? Description { get; set; }
     public required BoutiquePrixRequete[] ListePrix { get; set; }
}

public sealed class BoutiquePrixRequete
{
     public required string Nom { get; set; }
     public int Ordre { get; set; }
     public int Prix { get; set; }
}
