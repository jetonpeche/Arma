import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TypeLogistique } from "@models/Logistique";

export class TypeLogistiqueService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/type-logistique`;

    Lister(): Observable<TypeLogistique[]>
    {
        return this.http.get<TypeLogistique[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_nom: string): Observable<number>
    {
        const INFO = { nom: _nom };
        return this.http.post<number>(`${this.BASE_API}/ajouter`, INFO).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idTypeLogistique: number, _nom: string): Observable<void>
    {
        const INFO = { nom: _nom };
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idTypeLogistique}`, INFO).pipe(takeUntilDestroyed(this.destroyRef));
    }
}