import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { environment } from "../environements/environement";
import { Observable } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Parametre } from "@models/Parametre";

export class ParametreService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/parametre`;

    Modifier(_param: Parametre): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier`, _param).pipe(takeUntilDestroyed(this.destroyRef));
    }
}