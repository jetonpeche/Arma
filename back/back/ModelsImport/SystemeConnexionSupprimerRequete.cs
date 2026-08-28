namespace back.ModelsImport;

public sealed class SystemeConnexionSupprimerRequete
{
    public int IdSystemeA { get; set; }
    public int IdSystemeB { get; set; }
}

public sealed class SystemeConnexionRequete
{
    public int IdSystemeA { get; set; }
    public int IdSystemeB { get; set; }

    public string? Distance { get; set; }
}
