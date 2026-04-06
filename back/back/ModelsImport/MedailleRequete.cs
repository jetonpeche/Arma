namespace back.ModelsImport;

public sealed class MedailleRequete
{
     public required string Nom { get; set; }
     public required string Description { get; set; }
     public required int NbPoint { get; set; }

     /// <summary>
     /// 0 => Personnelle, 1 => services, 2 => campagne
     /// </summary>
     public required int Groupe { get; set; }
}
