import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DroitGroupe, DroitGroupeRequete } from "@models/DroitGroupe";
import { PersonnageDroitGroupe, PersonnageDroitGroupeRequete } from "@models/PersonnageDroitGroupe";

export class DroitGroupeService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/droit-groupe`;

    Lister(): Observable<DroitGroupe[]>
    {
        return this.http.get<DroitGroupe[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerPersonnage(): Observable<PersonnageDroitGroupe[]>
    {
        return this.http.get<PersonnageDroitGroupe[]>(`${this.BASE_API}/lister-personnage`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_droitGroupe: DroitGroupeRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _droitGroupe).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idDroitGroupe: number, _droitGroupe: DroitGroupeRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idDroitGroupe}`, _droitGroupe).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierPersonnage(_listeDroitGroupePersonnage: PersonnageDroitGroupeRequete[]): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier-droit-personnage`, _listeDroitGroupePersonnage).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idDroitGroupe: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idDroitGroupe}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}