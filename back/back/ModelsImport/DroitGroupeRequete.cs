using back.Models;

namespace back.ModelsImport;

public sealed class DroitGroupeRequete
{
     public required string Nom { get; set; }

     public required bool PeutAcheterVaisseau { get; set; }
     public required bool PeutAcheterLogistiqueMateriel { get; set; }
     public required Droit[] ListeDroit { get; set; }
}
