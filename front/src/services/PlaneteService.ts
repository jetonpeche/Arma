import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PlaneteOrigine } from "@models/PlaneteOrigine";

export class PlaneteService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/planete-origine`;

    Lister(): Observable<PlaneteOrigine[]>
    {
        return this.http.get<PlaneteOrigine[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_nomPlanete: string): Observable<number>
    {
        const INFO = { nom: _nomPlanete };
        return this.http.post<number>(`${this.BASE_API}/ajouter`, INFO).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idPlanete: number, _nomPlanete: string): Observable<void>
    {
        const INFO = { nom: _nomPlanete };
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idPlanete}`, INFO).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idPlanete: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idPlanete}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}