namespace back.ModelsImport.BatailleSpatials;

public sealed class ModifierPionTransformRequete
{
     public required Guid IdPion { get; set; }

     public required float PositionX { get; set; }
     public required float PositionY { get; set; }
     public required float RotationDegres { get; set; }
    public required float Echelle { get; set; }
    public required int visibiliteMode { get; set; }
}
