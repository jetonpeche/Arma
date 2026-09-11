namespace back.ModelsImport.BatailleSpatials;

public sealed class CreerSessionRequete
{
    public required string Nom { get; set; }
    public IFormFile? ImageCarte { get; set; }
    public int Largeur { get; set; }
    public int Hauteur { get; set; }

    public List<PionInitialRequete> ListeVaisseauInitial { get; set; } = [];
    public List<ElementDecorRequete> ListeDecore { get; set; } = [];
}

public sealed class ElementDecorRequete
{
    public IFormFile ImageAsset { get; set; } = null!;
    public float PositionX { get; set; }
    public float PositionY { get; set; }
    public float Echelle { get; set; } = 1.0f;
    public float RotationDegres { get; set; }
    public int OrdreCalque { get; set; } = 1;

    /// <summary>
    /// 0 => Tous (defaut)
    /// 1 => MJ seulement
    /// </summary>
    public int VisibiliteMode { get; set; } = 0;
}

public sealed class PionInitialRequete
{
    public int? IdVaisseauPosseder { get; set; }

    /// <summary>
    /// Vaisseau posseder par IA
    /// </summary>
    public int? IdVaisseau { get; set; }
    public float PositionX { get; set; }
    public float PositionY { get; set; }
    public float RotationDegres { get; set; }
    public bool MasquerAuxJoueurs { get; set; } = false;
}
