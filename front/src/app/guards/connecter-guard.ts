import { CanActivateFn } from '@angular/router';

export const connecterGuard: CanActivateFn = (route, state) => 
{
    return true;
};
