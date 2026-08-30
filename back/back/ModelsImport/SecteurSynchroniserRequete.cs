namespace back.ModelsImport;

public sealed class SecteurSynchroniserRequete
{
     public required List<SecteurZoneAjouterRequete> ListeCaseAjouter { get; set; }
     public required List<SecteurZoneModifierRequete> ListeCaseModifier { get; set; }
     public required List<SecteurZoneCartePositionRequete> ListeCaseSupprimer { get; set; }
}

public sealed class SecteurZoneAjouterRequete
{
     public int IdSecteur { get; set; }
     public int PositionX { get; set; }
     public int PositionY { get; set; }
}

public sealed class SecteurZoneModifierRequete
{
     public int IdSecteurNouveau { get; set; }
     public int PositionX { get; set; }
     public int PositionY { get; set; }
}

public sealed class SecteurZoneCartePositionRequete
{
     public int PositionX { get; set; }
     public int PositionY { get; set; }
}
