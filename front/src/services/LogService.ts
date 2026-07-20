import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HistoriqueRapportCampagne } from "@models/HistoriqueRapportCampagne";

export class LogService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/log`;

    RecupererDerniereEntrerPersonnageParticiperOperation(): Observable<HistoriqueRapportCampagne | null>
    {
        return this.http.get<HistoriqueRapportCampagne | null>(`${this.BASE_API}/derniere-entrer-perso-participer-ope`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}