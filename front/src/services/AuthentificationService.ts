import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject, signal } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Authentifier, Authentification } from "@models/Authentification";
import { Droit } from "@models/DroitGroupe";
import { EUrl } from "@enums/EUrl"
import { EModeBanque } from "@enums/EModeBanque";

export class AuthentificationService
{
    estConnecter = signal<boolean>(false);
    peutModifierBanque = signal<boolean>(false);
    nbPointBanque = signal<number>(0);

    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/authentification`;

    Connexion(_connexion: Authentification): Observable<Authentifier>
    {
        return this.http.post<Authentifier>(`${this.BASE_API}/connexion`, _connexion).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierPointBanque(_prix: number, _mode: EModeBanque = EModeBanque.Modifier): void
    {
        if(_mode == EModeBanque.Modifier)
        {
            var nouveauSolde = environment.utilisateur.nbPointBanque - _prix;

            if(nouveauSolde < 0)
            {
                this.nbPointBanque.set(0);
                environment.utilisateur.nbPointBanque = 0;
            }
            else
            {
                this.nbPointBanque.set(nouveauSolde);
                environment.utilisateur.nbPointBanque = nouveauSolde;
            }
        }
        else
        {
            this.nbPointBanque.update(x => x + _prix);
            environment.utilisateur.nbPointBanque += _prix;
        }

        sessionStorage.setItem("utilisateur", environment.utilisateur);
    }

    RecupererDroit(_url: EUrl): Droit
    {
        return (environment.utilisateur as Authentifier)
            .droit.listeDroit.find(x => _url.startsWith(x.routeGroupe, 1));
    }
}