import { CanActivateFn } from '@angular/router';
import { environment } from '../../environements/environement';
import { Authentifier } from '@models/Authentification';
import { EUrl } from '@enums/EUrl';

export const connecterGuard: CanActivateFn = (route, state) => 
{
    const utilisateur = environment.utilisateur as Authentifier;

    if (!utilisateur) 
        return false;

    const routesAccèsLibre = [
        EUrl.Boutique, EUrl.Personnage, EUrl.Specialite, EUrl.Medaille, 
        EUrl.HistoriqueCampagne, EUrl.Grade, EUrl.PlaneteOrigine, 
        EUrl.Vaisseau, EUrl.Formation, EUrl.Aeronef, EUrl.Orbat,
        "/cimetiere", "/flotte"
    ];

    if (routesAccèsLibre.includes(state.url)) 
        return true;

    const urlCible = state.url == "/gestion-boutique" ? EUrl.Boutique : state.url;

    const droit = utilisateur.droit?.listeDroit?.find(x => urlCible.startsWith(x.routeGroupe, 1));
    
    return droit?.peutLire ?? false;
};