import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Authentifier, Authentification } from "@models/Authentification";
import { Droit } from "@models/DroitGroupe";
import { EUrl } from "@enums/EUrl"

export class AuthentificationService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/authentification`;

    Connexion(_connexion: Authentification): Observable<Authentifier>
    {
        return this.http.post<Authentifier>(`${this.BASE_API}/connexion`, _connexion).pipe(takeUntilDestroyed(this.destroyRef));
    }

    RecupererDroit(_url: EUrl): Droit
    {
        return (environment.utilisateur as Authentifier)
            .droit.listeDroit.find(x => _url.startsWith(x.routeGroupe, 1));
    }
}