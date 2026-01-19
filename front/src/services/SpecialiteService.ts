import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Specialite, SpecialiteLeger, SpecialiteRequete } from "@models/Specialite";

export class SpecialiteService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/specialite`;

    Lister(): Observable<Specialite[]>
    {
        return this.http.get<Specialite[]>(`${this.BASE_API}/lister?leger=false`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerLeger(): Observable<SpecialiteLeger[]>
    {
        return this.http.get<SpecialiteLeger[]>(`${this.BASE_API}/lister?leger=true`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_specialite: SpecialiteRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _specialite).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idSpecialiste: number, _specialite: SpecialiteRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idSpecialiste}`, _specialite).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idSpecialiste: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idSpecialiste}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}