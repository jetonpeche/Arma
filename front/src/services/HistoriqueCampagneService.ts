import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HistoriqueCampagne, HistoriqueCampagneRequete } from "@models/HistoriqueCampagne";
import { Pagination } from "@models/Pagination";
import { Campagne, CampagneRequete } from "@models/Campagne";

export class HistoriqueCampagneService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/historique-campagne`;

    ListerCampagne(): Observable<Campagne[]>
    {
        return this.http.get<Campagne[]>(`${this.BASE_API}/lister-campagne`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerHistorique(_idCampagne: number, _page: number): Observable<Pagination<HistoriqueCampagne>>
    {
        return this.http.get<Pagination<HistoriqueCampagne>>(`${this.BASE_API}/lister-historique/${_idCampagne}?page=${_page}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterCampagne(_campagne: CampagneRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/ajouter-campagne`, _campagne).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterHistorique(_historiqueCampagne: HistoriqueCampagneRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter-historique`, _historiqueCampagne).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierHistorique(_idHistoriqueCampagne: number, _historiqueCampagne: HistoriqueCampagneRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier-historique/${_idHistoriqueCampagne}`, _historiqueCampagne).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierCampagne(_idCampagne: number, _campagne: CampagneRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier-campagne/${_idCampagne}`, _campagne).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerHistorique(_idHistoriqueCampagne: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-historique/${_idHistoriqueCampagne}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerCampagne(_idCampagne: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-campagne/${_idCampagne}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerImage(_idHistoriqueCampagne: number, _nomFichier: string): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-image/${_idHistoriqueCampagne}?nomFichier=${_nomFichier}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}