import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Systeme, SystemeConnecter, SystemeLeger, SystemePositionRequete, SystemeRequete } from "@models/Systeme";

export class SystemeService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/systeme`;

    Lister(): Observable<Systeme[]>
    {
        return this.http.get<Systeme[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerLeger(): Observable<SystemeLeger[]>
    {
        return this.http.get<Systeme[]>(`${this.BASE_API}/lister-leger`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerConnexion(): Observable<SystemeConnecter[]>
    {
        return this.http.get<SystemeConnecter[]>(`${this.BASE_API}/lister-connexion`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_systeme: SystemeRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _systeme).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idSysteme: number, _systeme: SystemeRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idSysteme}`, _systeme).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierPosition(_idSysteme: number, _position: SystemePositionRequete): Observable<void>
    {
        return this.http.patch<void>(`${this.BASE_API}/modifier-connexion/${_idSysteme}`, _position).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idSysteme: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idSysteme}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}