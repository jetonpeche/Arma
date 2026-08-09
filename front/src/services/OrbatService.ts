import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Orbat, OrbatRequete } from "@models/Orbat";

export class OrbatService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/orbat`;

    Lister(): Observable<Orbat[]>
    {
        return this.http.get<Orbat[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_orbat: OrbatRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/ajouter`, _orbat).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idOrbat: number, _orbat: OrbatRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idOrbat}`, _orbat).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idOrbat: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idOrbat}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}