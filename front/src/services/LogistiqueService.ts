import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { map, Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Logistique, LogistiqueRequete } from "@models/Logistique";

export class LogistiqueService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/logistique`;

    Lister(): Observable<Logistique[]>
    {
        return this.http.get<Logistique[]>(`${this.BASE_API}/lister`)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map(x =>
                {
                    for (let i = 0; i < x.length; i++) 
                        x[i].kind = "Logistique";

                    return x;
                })
            );
    }

    Ajouter(_logistique: LogistiqueRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _logistique).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idLogistique: number, _logistique: LogistiqueRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idLogistique}`, _logistique).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idLogistique: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idLogistique}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}