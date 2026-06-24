using back.Enums;

namespace back.ModelsImport;

public sealed class DecisionAchatRequete
{
     public int IdPropositionAchat { get; set; }
     public int? IdType { get; set; }
     public ETypeObjetProposer? Type { get; set; }
     public bool AchatEstValider { get; set; }
}
