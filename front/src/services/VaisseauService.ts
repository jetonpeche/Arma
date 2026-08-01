import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Vaisseau, VaisseauAchaterRequete, VaisseauLeger, VaisseauRequete } from "@models/Vaisseau";
import { VaisseauPosseder, VaisseauPossederAeronefRequete, VaisseauPossederArmementRequete, VaisseauPossederContenuStockage, VaisseauPossederRequete, VaisseauPossederStockageCompatible } from "@models/VaisseauPosseder";

export class VaisseauService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/vaisseau`;

    Lister(): Observable<Vaisseau[]>
    {
        return this.http.get<Vaisseau[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerLeger(): Observable<VaisseauLeger[]>
    {
        return this.http.get<VaisseauLeger[]>(`${this.BASE_API}/lister-leger`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerPosseder(): Observable<VaisseauPosseder[]>
    {
        return this.http.get<VaisseauPosseder[]>(`${this.BASE_API}/lister-posseder`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerStockageCompatible(_idTypeStockage: number): Observable<VaisseauPossederStockageCompatible[]>
    {
        return this.http.get<VaisseauPossederStockageCompatible[]>(`${this.BASE_API}/lister-stockage-compatible/${_idTypeStockage}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerContenuStockage(_idVaisseauPosseder: number, _idStockage: number): Observable<VaisseauPossederContenuStockage[]>
    {
        return this.http.get<VaisseauPossederContenuStockage[]>(`${this.BASE_API}/${_idVaisseauPosseder}/lister-contenu-stockage/${_idStockage}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_vaisseau: VaisseauRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/ajouter`, _vaisseau).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idVaisseau: number, _vaisseau: VaisseauRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idVaisseau}`, _vaisseau).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierPosseder(_idVaisseauPosseder: number, _vaisseau: VaisseauPossederRequete): Observable<void>
    {
        return this.http.patch<void>(`${this.BASE_API}/modifier-posseder/${_idVaisseauPosseder}`, _vaisseau).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierArmementPosseder(_idVaisseauPosseder: number, _armement: VaisseauPossederArmementRequete): Observable<void>
    {
        return this.http.patch<void>(`${this.BASE_API}/modifier-armement-posseder/${_idVaisseauPosseder}`, _armement).pipe(takeUntilDestroyed(this.destroyRef)); 
    }

    ModifierAeronefPosseder(_idVaisseauPosseder: number, _aeronef: VaisseauPossederAeronefRequete): Observable<void>
    {
        return this.http.patch<void>(`${this.BASE_API}/modifier-aeronef-posseder/${_idVaisseauPosseder}`, _aeronef).pipe(takeUntilDestroyed(this.destroyRef)); 
    }

    Acheter(_vaisseauAcheter: VaisseauAchaterRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/acheter`, _vaisseauAcheter).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idVaisseau: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idVaisseau}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}