namespace back.ModelsImport;

public sealed class AeronefRequete
{
    public int Prix { get; set; }

    public string Nom { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string? Description { get; set; }
}
