import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { map, Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Personnage, PersonnageModifierRequete, PersonnageRequete } from "@models/Personnage";
import { PersonnageMort, PersonnageMortRequete } from "@models/PersonnageMort";

export class PersonnageService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/personnage`;

    Lister(): Observable<Personnage[]>
    {
        return this.http.get<Personnage[]>(`${this.BASE_API}/lister`).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(x => {

                for (const element of x) 
                {
                    element.dateCreation = new Date(element.dateCreation);

                    if(element.dateDerniereParticipation)
                        element.dateDerniereParticipation = new Date(element.dateDerniereParticipation);
                }

                return x;
            })
        );
    }

    ListerMort(): Observable<PersonnageMort[]>
    {
        return this.http.get<PersonnageMort[]>(`${this.BASE_API}/lister-mort`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_personnage: PersonnageRequete): Observable<number>
    {
        if(_personnage.etatService?.trim().length == 0)
            _personnage.etatService = null;

        return this.http.post<number>(`${this.BASE_API}/ajouter`, _personnage).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idPersonnage: number, _personnage: PersonnageModifierRequete): Observable<void>
    {
        if(_personnage.etatService?.trim().length == 0)
            _personnage.etatService = null;
        
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idPersonnage}`, _personnage).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierPoint(_listeIdPersonnage: number[]): Observable<void>
    {
       return this.http.patch<void>(`${this.BASE_API}/modifier-point`, _listeIdPersonnage).pipe(takeUntilDestroyed(this.destroyRef));
    }

    DeclarerMort(_idPersonnage: number, _personnageMort: PersonnageMortRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/declarer-mort/${_idPersonnage}`, _personnageMort).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idPersonnage: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idPersonnage}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}