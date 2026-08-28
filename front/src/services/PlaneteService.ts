import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PlaneteConnecter, PlaneteConnecterSupprimerRequete, PlaneteOrigine, PlaneteOrigineLeger, PlaneteOrigineRequete } from "@models/PlaneteOrigine";
import { Pagination } from "@models/Pagination";
import { SystemePositionRequete } from "@models/Systeme";

export class PlaneteService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/planete-origine`;

    Lister(_idSyteme: number): Observable<PlaneteOrigine[]>
    {
        return this.http.get<PlaneteOrigine[]>(`${this.BASE_API}/lister/${_idSyteme}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerLeger(): Observable<PlaneteOrigineLeger[]>
    {
        return this.http.get<PlaneteOrigineLeger[]>(`${this.BASE_API}/lister-leger`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerConnexion(): Observable<PlaneteConnecter[]>
    {
        return this.http.get<PlaneteConnecter[]>(`${this.BASE_API}/lister-connexion`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_planete: PlaneteOrigineRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _planete).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterConnexion(_connexion: PlaneteConnecter): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/connecter`, _connexion).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idPlanete: number, _planete: PlaneteOrigineRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idPlanete}`, _planete).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierPosition(_idPlanete: number, _position: SystemePositionRequete): Observable<void>
    {
        return this.http.patch<void>(`${this.BASE_API}/modifier-connexion/${_idPlanete}`, _position).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idPlanete: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idPlanete}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerConnexion(_planeteConnexion: PlaneteConnecterSupprimerRequete): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-connexion`, { body: _planeteConnexion }).pipe(takeUntilDestroyed(this.destroyRef));
    }
}