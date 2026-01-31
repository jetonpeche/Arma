import { CanActivateFn } from '@angular/router';
import { environment } from '../../environements/environement';
import { Authentifier } from '@models/Authentification';
import { EUrl } from '@enums/EUrl';

export const connecterGuard: CanActivateFn = (route, state) => 
{
    if(!environment.utilisateur)
        return false;

    if(state.url == EUrl.Boutique)
        return true;

    let utilisateurDroit = (environment.utilisateur as Authentifier).droit;

    if(state.url == EUrl.Materiel)
    {
        let liste = utilisateurDroit.listeDroit
            .filter(x => 
                "/" + x.routeGroupe == EUrl.Materiel || 
                "/" + x.routeGroupe == EUrl.TypeMateriel
            );

        return liste.some(x => x.peutLire);
    }

    if(state.url == EUrl.Logistique)
    {
        let liste = utilisateurDroit.listeDroit
            .filter(x => 
                "/" + x.routeGroupe == EUrl.Logistique || 
                "/" + x.routeGroupe == EUrl.TypeLogistique || 
                "/" + x.routeGroupe == EUrl.TypeStockageLogistique
            );

        return liste.some(x => x.peutLire);
    }

    let url = state.url;

    if(state.url == "/gestion-boutique")
        url = EUrl.Boutique;

    let droit = utilisateurDroit
        .listeDroit
        .find(x => url.startsWith(x.routeGroupe, 1));
    
    return droit.peutLire;
};
