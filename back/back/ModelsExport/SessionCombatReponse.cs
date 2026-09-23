using System.Text.Json.Serialization;
using back.Enums;

namespace back.ModelsExport;

public sealed class SessionCombatReponse
{
    public required string NomPartie { get; set; }
    
    public required string UrlImagecarte { get; set; }
    public required int Largeur { get; set; }
    public required int Hauteur { get; set; }

    public required List<SessionCombatPionReponse> ListePion { get; set; }
    public required List<SessionCombatDecorReponse> ListeDecor { get; set; }
    public List<SessionCombatBibliothequeDecorReponse> BibliothequeDecor { get; set; } = [];
}

public sealed class SessionCombatPionReponse
{
    public required Guid IdPion { get; set; }
    public required int IdVaisseau { get; set; }

    public required float PositionX { get; set; }
    public required float PositionY { get; set; }
    public required float RotationDegres { get; set; }

    // Null = contrôlé uniquement par le MJ
    public required int? IdUtilisateurAssigner { get; set; }

    // Gestion de la Visibilité Sélective
    public required EModeVisibilite VisibiliteMode { get; set; }
    public required List<int> ListeIdUtilisateurAutoriser { get; set; }
    public required ETypeRevelation RevelationType { get; set; }
}

public sealed class SessionCombatDecorReponse
{
    public required Guid IdDecor { get; set; }
    public required int IdBibliothequeDecor { get; set; }

    public required float PositionX { get; set; }
    public required float PositionY { get; set; }
    public required float Echelle { get; set; }
    public required float RotationDegres { get; set; }
    public required int OrdreCalque { get; set; }

    public required EModeVisibilite VisibiliteMode { get; set; }
    public required List<int> ListeIdUtilisateurAutoriser { get; set; }
}

public sealed class SessionCombatBibliothequeDecorReponse
{
    public required int Id { get; set; }
    public string? NomRecheche { get; set; }
    public required string UrlImage { get; set; }
}

[JsonSerializable(typeof(SessionCombatReponse))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
public partial class SessionCombatReponseContext: JsonSerializerContext;
