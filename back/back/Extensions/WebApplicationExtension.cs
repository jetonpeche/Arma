using back.Middlewares;
using back.Routes;

namespace back.Extensions;

public static class WebApplicationExtension
{
     public static WebApplication AjouterRouteAPI(this WebApplication _app)
     {
        var mapGroupeSecu = _app.MapGroup("api").AddEndpointFilter<DroitMiddleware>();
        var mapGroupe = _app.MapGroup("api");

          mapGroupeSecu.MapGroup("").AjouterTestRoute();
          mapGroupe.MapGroup("authentification").AjouterRouteAuthentification();
          mapGroupeSecu.MapGroup("personnage").AjouterRoutePersonnage();
          mapGroupeSecu.MapGroup("grade").AjouterRouteGrade();
          mapGroupeSecu.MapGroup("planete-origine").AjouterRoutePlaneteOrigine();
          mapGroupeSecu.MapGroup("specialite").AjouterRouteSpecialite();
          mapGroupeSecu.MapGroup("upload-fichier").AjouterRouteFichier();
          mapGroupeSecu.MapGroup("boutique").AjouterRouteBoutique();
          mapGroupeSecu.MapGroup("logistique").AjouterRouteLogistique();
          mapGroupeSecu.MapGroup("type-logistique").AjouterRouteTypeLogistique();
          mapGroupeSecu.MapGroup("type-stockage-logistique").AjouterRouteTypeStockageLogistique();
          mapGroupeSecu.MapGroup("materiel").AjouterRouteMateriel();
          mapGroupeSecu.MapGroup("type-materiel").AjouterRouteTypeMateriel();
          mapGroupeSecu.MapGroup("vaisseau").AjouterRouteVaisseau();
          mapGroupeSecu.MapGroup("proposition-achat").AjouterRoutePropositionAchat();
          mapGroupeSecu.MapGroup("droit-groupe").AjouterRouteDroitGroupe();

          return _app;
     }
}
