import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TypeStockageLogistique } from "@models/Logistique";

export class TypeStockageLogistiqueService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/type-stockage-logistique`;

    Lister(): Observable<TypeStockageLogistique[]>
    {
        return this.http.get<TypeStockageLogistique[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_nom: string): Observable<number>
    {
        const INFO = { nom: _nom };
        return this.http.post<number>(`${this.BASE_API}/ajouter`, INFO).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idTypeStockageLogistique: number, _nom: string): Observable<void>
    {
        const INFO = { nom: _nom };
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idTypeStockageLogistique}`, INFO).pipe(takeUntilDestroyed(this.destroyRef));
    }
}