namespace back.ModelsImport.BatailleSpatials;

public sealed class ModifierPionTransformRequete
{
     public required Guid IdPion { get; set; }

     public required float PositionX { get; set; }
     public required float PositionY { get; set; }
     public required int RotationDegres { get; set; }
}
