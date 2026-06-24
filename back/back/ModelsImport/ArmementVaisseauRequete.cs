using System.Text.Json.Serialization;

namespace back.ModelsImport;

public class ArmementVaisseauRequete
{
     public string Nom { get; set; } = null!;
     public string? Information { get; set; }
     public int Nombre { get; set; }
     public int Munition { get; set; }
     public bool MunitionInfini { get; set; }
     public bool EstUsageUnique { get; set; }
     public int NbTourReload { get; set; }
}

public sealed class ArmementVaisseauModifierRequete: ArmementVaisseauRequete
{
     public Guid Id { get; set; }
}

[JsonSerializable(typeof(ArmementVaisseauRequete[]))]
[JsonSerializable(typeof(ArmementVaisseauRequete))]
public partial class ArmementVaisseauRequeteContext: JsonSerializerContext { }

[JsonSerializable(typeof(ArmementVaisseauModifierRequete[]))]
[JsonSerializable(typeof(ArmementVaisseauModifierRequete))]
public partial class ArmementVaisseauModifierRequeteContext : JsonSerializerContext { }
