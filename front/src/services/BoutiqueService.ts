import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Boutique, BoutiqueAdmin, BoutiquePersonnageAcheterRequete, BoutiqueRequete } from "@models/Boutique";

export class BoutiqueService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/boutique`;

    Lister(_idPersonnage: number): Observable<Boutique[]>
    {
        return this.http.get<Boutique[]>(`${this.BASE_API}/lister/${_idPersonnage}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerAdmin(): Observable<BoutiqueAdmin[]>
    {
        return this.http.get<BoutiqueAdmin[]>(`${this.BASE_API}/lister-admin`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Acheter(_boutiquePersonnagePayer: BoutiquePersonnageAcheterRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/acheter`, _boutiquePersonnagePayer).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_boutique: BoutiqueRequete): Observable<number>
    {
        if(_boutique.description?.trim().length == 0)
            _boutique.description = null;

        return this.http.post<number>(`${this.BASE_API}/ajouter`, _boutique).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idBoutique: number, _boutique: BoutiqueRequete): Observable<void>
    {
        if(_boutique.description?.trim().length == 0)
            _boutique.description = null;

        return this.http.put<void>(`${this.BASE_API}/modifier/${_idBoutique}`, _boutique).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idBoutique: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idBoutique}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}