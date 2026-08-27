namespace back.ModelsImport;

public sealed class SecteurRequete
{
    public string Nom { get; set; } = null!;
    public string? Description { get; set; }

    public decimal PositionX { get; set; }
    public decimal PositionY { get; set; }
}
