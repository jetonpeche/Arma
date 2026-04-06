using System.Text.Json.Serialization;

namespace back.ModelsExport;

public sealed class MedailleReponse
{
     public required int Id { get; set; }
     public required string Nom { get; set; }
     public required string Description { get; set; }
     public required string? NomFichier { get; set; }
     public required int NbPoint { get; set; }

     /// <summary>
     /// 0 => Personnelle, 1 => services, 2 => campagne
     /// </summary>
     public required int Groupe { get; set; }
}

[JsonSerializable(typeof(MedailleReponse[]))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class MedailleReponseContext : JsonSerializerContext;
