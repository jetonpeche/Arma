import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HistoriqueCampagne, HistoriqueCampagneRequete } from "@models/HistoriqueCampagne";
import { Pagination } from "@models/Pagination";

export class HistoriqueCampagneService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/historique-campagne`;

    Lister(_page: number): Observable<Pagination<HistoriqueCampagne>>
    {
        return this.http.get<Pagination<HistoriqueCampagne>>(`${this.BASE_API}/lister?page=${_page}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_historiqueCampagne: HistoriqueCampagneRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _historiqueCampagne).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idHistoriqueCampagne: number, _historiqueCampagne: HistoriqueCampagneRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idHistoriqueCampagne}`, _historiqueCampagne).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idHistoriqueCampagne: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idHistoriqueCampagne}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerImage(_idHistoriqueCampagne: number, _nomFichier: string): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-image/${_idHistoriqueCampagne}?nomFichier=${_nomFichier}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}