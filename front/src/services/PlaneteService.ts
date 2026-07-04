import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PlaneteOrigine, PlaneteOrigineRequete } from "@models/PlaneteOrigine";

export class PlaneteService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/planete-origine`;

    Lister(): Observable<PlaneteOrigine[]>
    {
        return this.http.get<PlaneteOrigine[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_planete: PlaneteOrigineRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _planete).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idPlanete: number, _planete: PlaneteOrigineRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idPlanete}`, _planete).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idPlanete: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idPlanete}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}