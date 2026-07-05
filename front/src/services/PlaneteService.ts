import { HttpClient, HttpParams } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PlaneteOrigine, PlaneteOrigineLeger, PlaneteOrigineRequete } from "@models/PlaneteOrigine";
import { Pagination } from "@models/Pagination";

export class PlaneteService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/planete-origine`;

    Lister(_page: number,  _recherche: string = ""): Observable<Pagination<PlaneteOrigine>>
    {
        let params = new HttpParams()
            .set("page", _page)
            .set("thermeRecherche", _recherche);

        return this.http.get<Pagination<PlaneteOrigine>>(`${this.BASE_API}/lister`, { params: params }).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerLeger(): Observable<PlaneteOrigineLeger[]>
    {
        return this.http.get<PlaneteOrigineLeger[]>(`${this.BASE_API}/lister-leger`).pipe(takeUntilDestroyed(this.destroyRef));
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