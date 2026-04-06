namespace back;

public static class Constant
{
#if DEBUG
     public const string BDD_NOM = "Filename=Bdd/halo.db;Connection=Shared";
#else
     public const string BDD_NOM = "Filename=/app/data/halo.db;Connection=Shared";
#endif
     public const string CHEMIN_IMG_BOUTIQUE = "/Photos/Boutique/";
    public const string CHEMIN_IMG_PERSONNAGE = "/Photos/Personnage/";
    public const string CHEMIN_IMG_VAISSEAU = "/Photos/Vaisseau/";
     public const string CHEMIN_IMG_GRADE = "/Photos/Grade/";
     public const string CHEMIN_IMG_MEDAILLE = "/Photos/Medaille/";
}
