import { CanActivateFn } from '@angular/router';
import { environment } from '../../environements/environement';
import { Authentifier } from '@models/Authentification';
import { EUrl } from '@enums/EUrl';

export const connecterGuard: CanActivateFn = (route, state) => 
{
    if(!environment.utilisateur)
        return false;

    if(
        state.url == EUrl.Boutique || state.url == EUrl.Personnage || 
        state.url == EUrl.Specialite || state.url == EUrl.Medaille || 
        state.url == EUrl.HistoriqueCampagne || state.url == EUrl.Grade ||
        state.url == EUrl.PlaneteOrigine || state.url == "/cimetiere" || 
        state.url == "/flotte" || state.url == EUrl.Vaisseau || state.url == EUrl.Formation ||
        state.url == EUrl.Aeronef || state.url == "/orbat"
    )
        return true;

    let utilisateurDroit = (environment.utilisateur as Authentifier).droit;
    
    let url = state.url;

    if(state.url == "/gestion-boutique")
        url = EUrl.Boutique;

    let droit = utilisateurDroit
        .listeDroit
        .find(x => url.startsWith(x.routeGroupe, 1));
    
    return droit.peutLire;
};
