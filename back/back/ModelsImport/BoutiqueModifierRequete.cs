namespace back.ModelsImport;

public sealed class BoutiqueModifierRequete
{
     public required string Titre { get; set; }
     public string? Description { get; set; }
     public required BoutiquePrixModifierRequete[] ListePrix { get; set; }
}

public sealed class BoutiquePrixModifierRequete
{
     public int? Id { get; set; }
     public required string Nom { get; set; }
     public int Ordre { get; set; }
     public int Prix { get; set; }
}
