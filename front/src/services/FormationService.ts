import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { DestroyRef, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Formation, FormationRequete } from "@models/Formation";

export class FormationService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/formation`;

    Lister(): Observable<Formation[]>
    {
        return this.http.get<Formation[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_formation: FormationRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/ajouter`, _formation).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idFormation: number, _formation: Formation): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier`, _formation).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idFormation: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idFormation}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}