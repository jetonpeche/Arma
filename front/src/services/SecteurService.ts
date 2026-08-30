import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Secteur, SecteurRequete, SecteurSynchroniser } from "@models/Secteur";

export class SecteurService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/secteur`;

    Lister(): Observable<Secteur[]>
    {
        return this.http.get<Secteur[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_secteur: SecteurRequete):Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _secteur).pipe(takeUntilDestroyed(this.destroyRef)); 
    }

    Modifier(_idSecteur: number, _secteur: SecteurRequete):Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idSecteur}`, _secteur).pipe(takeUntilDestroyed(this.destroyRef)); 
    }

    Synchroniser(_listeZoneCase: SecteurSynchroniser): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/synchroniser`, _listeZoneCase).pipe(takeUntilDestroyed(this.destroyRef)); 
    }

    Supprimer(_idSecteur: number):Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idSecteur}`).pipe(takeUntilDestroyed(this.destroyRef)); 
    }
}