using back.Enums;

namespace back.ModelsImport.BatailleSpatials;

public sealed class PionRequete
{
     public int IdVaisseau { get; set; }
     public EPionAjout Appartenance { get; set; }

     public int PositionX { get; set; }
     public int PositionY { get; set; }
     public int RotationDegres { get; set; }

     /// <summary>
     /// 0 => Tous,
     /// 1 => MJ uniquement
     /// </summary>
     public int Visibilite { get; set; }

     public string? NomCommandant { get; set; }
     public string? NomVaisseau { get; set; }
}
