import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environements/environement';
import { inject } from '@angular/core';
import { SnackBarService } from '@services/SnackBarService';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => 
{
    let snackBarServ = inject(SnackBarService);
    let router = inject(Router);

    if(environment.utilisateur)
    {
        req = req.clone({
            headers: req.headers.set("Authorization", `Bearer ${environment.utilisateur.jwt}`)
        });
    }

    return next(req).pipe(
        catchError(
        (erreur) =>
        {
            console.log(erreur);

            switch (erreur.status) 
            {
                case 500:
                    snackBarServ.Erreur("Erreur interne c'est produite");
                    break;

                case 401:
                    snackBarServ.Erreur("Veuillez-vous connecter");
                    localStorage.removeItem("utilisateur");
                    router.navigateByUrl("/");
                    break;

                case 403:
                    snackBarServ.Erreur("Vous n'avez pas l'autorisation");
                    break;

                case 404:
                case 400:
                    snackBarServ.Erreur(erreur.error);
                    break;

                case 429:
                    snackBarServ.Erreur("Spam détecté veuillez patienter");
                    break;
                
                default:
                    snackBarServ.Erreur("Erreur pas de réseau");
                    break;
            }
            
            return throwError(() => null);
        })
    );
};
