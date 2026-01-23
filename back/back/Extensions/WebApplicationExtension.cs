using back.Routes;

namespace back.Extensions;

public static class WebApplicationExtension
{
     public static WebApplication AjouterRouteAPI(this WebApplication _app)
     {
        var mapGroupe = _app.MapGroup("api");

          mapGroupe.MapGroup("").AjouterTestRoute();
          mapGroupe.MapGroup("authentification").AjouterRouteAuthentification();
          mapGroupe.MapGroup("personnage").AjouterRoutePersonnage();
          mapGroupe.MapGroup("grade").AjouterRouteGrade();
          mapGroupe.MapGroup("planete-origine").AjouterRoutePlaneteOrigine();
          mapGroupe.MapGroup("specialite").AjouterRouteSpecialite();
          mapGroupe.MapGroup("upload-fichier").AjouterRouteFichier();
          mapGroupe.MapGroup("boutique").AjouterRouteBoutique();
          mapGroupe.MapGroup("logistique").AjouterRouteLogistique();
          mapGroupe.MapGroup("type-logistique").AjouterRouteTypeLogistique();
          mapGroupe.MapGroup("type-stockage-logistique").AjouterRouteTypeStockageLogistique();
          mapGroupe.MapGroup("materiel").AjouterRouteMateriel();
          mapGroupe.MapGroup("type-materiel").AjouterRouteTypeMateriel();
          mapGroupe.MapGroup("vaisseau").AjouterRouteVaisseau();
          mapGroupe.MapGroup("proposition-achat").AjouterRoutePropositionAchat();

          return _app;
     }
}
