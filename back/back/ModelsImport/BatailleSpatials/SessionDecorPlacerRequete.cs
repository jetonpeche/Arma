namespace back.ModelsImport.BatailleSpatials;

public sealed class SessionDecorPlacerRequete
{
     public int IdBibliothequeDecor { get; set; }
     public required float PositionX { get; set; }
     public required float PositionY { get; set; }
     public required float Echelle { get; set; }
     public required float RotationDegres { get; set; }
     public required int OrdreCalque { get; set; }

     /// <summary>
     /// 0 => Tous (defaut)
     /// 1 => MJ seulement
     /// </summary>
     public int VisibiliteMode { get; set; } = 0;
}
