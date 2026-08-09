using back.Models;
using LiteDB;

namespace back.ModelsExport;

public sealed class OrbatReponse
{
     public required int Id { get; set; }

     public required int? IdParent { get; set; }

     public required string? Titre { get; set; }

     public required string? Indicatif { get; set; }

     public required string? FrequenceRadio { get; set; }

     public required string UrlImage { get; set; }

     public required List<OrbatSlotReponse> ListeSlot { get; set; }
}

public sealed class OrbatSlotReponse
{
     public required GradeLegerReponse? GradeRequis { get; set; }

     public required PersonnageLegerReponse? Personnage { get; set; }

     public required string Role { get; set; } = null!;

     public required int OrdreAffichage { get; set; }

     public required bool EstOptionnel { get; set; }
}