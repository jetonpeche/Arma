import { CanActivateFn } from '@angular/router';
import { environment } from '../../environements/environement';

export const connecterGuard: CanActivateFn = (route, state) => 
{
    return environment.utilisateur != null && environment.utilisateur != undefined;
};
