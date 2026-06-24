import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TypeMateriel } from "@models/Materiel";

export class TypeMaterielService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/type-materiel`;

    Lister(): Observable<TypeMateriel[]>
    {
        return this.http.get<TypeMateriel[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_nom: string): Observable<number>
    {
        const INFO = { nom: _nom };
        return this.http.post<number>(`${this.BASE_API}/ajouter`, INFO).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idTypeMateriel: number, _nom: string): Observable<void>
    {
        const INFO = { nom: _nom };
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idTypeMateriel}`, INFO).pipe(takeUntilDestroyed(this.destroyRef));
    }
}