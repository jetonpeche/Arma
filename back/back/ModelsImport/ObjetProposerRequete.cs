using back.Enums;
using System.Text.Json.Serialization;

namespace back.ModelsImport;

public sealed class ObjetProposerRequete
{
     public int IdType { get; set; }
     public ETypeObjetProposer Type { get; set; }
     public int Quantite { get; set; }

     [JsonIgnore]
     public int PrixUnitaire { get; set; }

     [JsonIgnore]
     public string Nom { get; set; } = null!;
}
