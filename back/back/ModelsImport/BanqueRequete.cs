using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class BanqueRequete
{
     public int NbPoint { get; set; }
     public int Mode { get; set; }
}

[JsonSerializable(typeof(BanqueRequete))]
public partial class BanqueRequeteContext : JsonSerializerContext { }
