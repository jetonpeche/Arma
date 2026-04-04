import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { EModeBanque } from "@enums/EModeBanque";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

export class BanqueService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/banque`;

    Modifier(_nbPoint: number, _mode: EModeBanque): Observable<void>
    {
        const INFOS = { nbPoint: _nbPoint, mode: _mode };
        return this.http.put<void>(`${this.BASE_API}/modifier`, INFOS).pipe(takeUntilDestroyed(this.destroyRef));
    }
}