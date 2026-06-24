import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { map, Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Materiel, MaterielRequete } from "@models/Materiel";

export class MaterielService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/materiel`;

    Lister(): Observable<Materiel[]>
    {
        return this.http.get<Materiel[]>(`${this.BASE_API}/lister`)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map(x =>
                {
                    for (let i = 0; i < x.length; i++) 
                        x[i].kind = "Materiel";

                    return x;
                })
            );
    }

    Ajouter(_materiel: MaterielRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _materiel).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idMateriel: number, _materiel: MaterielRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idMateriel}`, _materiel).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idMateriel: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idMateriel}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}