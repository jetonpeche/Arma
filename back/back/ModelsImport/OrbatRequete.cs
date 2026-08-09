using back.Models;

namespace back.ModelsImport;

public sealed class OrbatRequete
{
     public int? IdParent { get; set; }

     public string? Titre { get; set; }

     public string? Indicatif { get; set; }

     public string? FrequenceRadio { get; set; }

     public List<OrbatSlotRequete> ListeSlot { get; set; } = [];
}

public sealed class OrbatSlotRequete
{
     public Guid? id { get; set; }
     public int? IdGradeRequis { get; set; }
     public int? IdPersonnage { get; set; }
     public required string Role { get; set; }
     public required int OrdreAffichage { get; set; }
     public bool EstOptionnel { get; set; }
}
