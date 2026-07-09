using System.Text.Json.Serialization;
using LiteDB;

namespace back.Models;

public sealed class Preset
{
    [BsonId]
    public int Id { get; set; }
    public string ServeurTS { get; set; } = null!;
    public string MdpTS { get; set; } = null!;
    public string MdpArma { get; set; } = null!;
    public string CodeAmiSteam { get; set; } = null!;
    public string? NomFichier { get; set; }
    public string? AliasNomFichier { get; set; }
}
