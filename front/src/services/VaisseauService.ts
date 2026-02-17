import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Vaisseau, VaisseauAchaterRequete } from "@models/Vaisseau";

export class VaisseauService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/vaisseau`;

    Lister(): Observable<Vaisseau[]>
    {
        return this.http.get<Vaisseau[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Acheter(_vaisseauAcheter: VaisseauAchaterRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/acheter`, _vaisseauAcheter).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idVaisseau: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idVaisseau}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}