using back.Enums;
using LiteDB;

namespace back.Models;

public class CombatSession
{
    [BsonId]
    public int Id { get; set; }
    public string NomPartie { get; set; } = null!;
    
    // Paramètres de la carte
    public string NomImageCarte { get; set; } = null!;
    public int Largeur { get; set; }
    public int Hauteur { get; set; }

    // Liste des pions actuellement déployés
    public List<PionVaisseauCombat> ListeVaisseauSurCarte { get; set; } = [];
    public List<ElementDecorCombat> ListeDecorSurCarte { get; set; } = [];
}

public sealed class PionVaisseauCombat
{
    public Guid IdPion { get; set; }
    public int IdVaisseauPosseder { get; set; }
    public string NomAffichage { get; set; } = null!;
    public string AssetSpriteUrl { get; set; } = null!;

    // Données spatiales sur le Canvas
    public float PositionX { get; set; }
    public float PositionY { get; set; }
    public float RotationDegres { get; set; }

    // Contrôle du pion
    // Null = contrôlé uniquement par le MJ
    public int? IdUtilisateurAssigner { get; set; } 

    // Gestion de la Visibilité Sélective
    public EModeVisibilite VisibiliteMode { get; set; } = EModeVisibilite.Tous;
    public List<int> IdUtilisateurAutoriser { get; set; } = [];
    public ETypeRevelation RevelationType { get; set; } = ETypeRevelation.Complet;
}

public sealed class ElementDecorCombat
{
    public Guid IdDecor { get; set; } = Guid.NewGuid();
    public string AssetNomImage { get; set; } = null!;
    
    public float PositionX { get; set; }
    public float PositionY { get; set; }
    public float Echelle { get; set; } = 1.0f;
    public float RotationDegres { get; set; }
    public int OrdreCalque { get; set; } = 1;

    // Visibilité
    public EModeVisibilite VisibiliteMode { get; set; } = EModeVisibilite.Tous;
    public List<int> IdUtilisateurAutoriser { get; set; } = [];
}
