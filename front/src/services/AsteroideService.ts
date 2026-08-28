import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PlaneteConnecter, PlaneteConnecterSupprimerRequete, PlaneteOrigine, PlaneteOrigineLeger, PlaneteOrigineRequete } from "@models/PlaneteOrigine";
import { SystemePositionRequete } from "@models/Systeme";
import { Asteroide, AsteroideConnecter, AsteroideConnecterSupprimerRequete, AsteroideRequete } from "@models/Asteroide";

export class AsteroideService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/asteroide`;

    Lister(_idSyteme: number): Observable<Asteroide[]>
    {
        return this.http.get<Asteroide[]>(`${this.BASE_API}/lister/${_idSyteme}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerConnexion(): Observable<AsteroideConnecter[]>
    {
        return this.http.get<AsteroideConnecter[]>(`${this.BASE_API}/lister-connexion`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_asteroide: AsteroideRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _asteroide).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterConnexion(_connexion: AsteroideConnecter): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/connecter`, _connexion).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idAsteroide: number, _asteroide: PlaneteOrigineRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idAsteroide}`, _asteroide).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierPosition(_idAsteroide: number, _position: SystemePositionRequete): Observable<void>
    {
        return this.http.patch<void>(`${this.BASE_API}/modifier-position/${_idAsteroide}`, _position).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idAsteroide: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idAsteroide}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerConnexion(_planeteConnexion: AsteroideConnecterSupprimerRequete): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-connexion`, { body: _planeteConnexion }).pipe(takeUntilDestroyed(this.destroyRef));
    }
}