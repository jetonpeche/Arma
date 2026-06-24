namespace back.Models;

public sealed class ArmementVaisseau
{
     public Guid Id { get; set; }
     public string Nom { get; set; } = null!;
     public string? Information { get; set; }
     public int Nombre { get; set; }
     public int Munition { get; set; }
     public bool MunitionInfini { get; set; }
     public bool EstUsageUnique { get; set; }
     public int NbTourReload { get; set; }
}
