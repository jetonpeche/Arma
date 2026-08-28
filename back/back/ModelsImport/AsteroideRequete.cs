namespace back.ModelsImport;

public sealed class AsteroideRequete
{
     public required int IdSysteme { get; set; }
     public required string? Nom { get; set; }
     public required string? Description { get; set; }
     public required int Statut { get; set; }

     public required decimal PositionX { get; set; }
     public required decimal PositionY { get; set; }
}

public sealed class AsteroideConnexionSupprimerRequete
{
     public int IdAsteroideA { get; set; }
     public int IdAsteroideB { get; set; }
}

public sealed class AsteroideConnexionRequete
{
     public int IdAsteroideA { get; set; }
     public int IdAsteroideB { get; set; }

     public string? Distance { get; set; }
}
