import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Aeronef, AeronefAchatRequete, AeronefLeger, AeronefRequete, VaisseauAeronefPlaceDisponible } from "@models/Aeronef";

export class AeronefService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/aeronef`;

    Lister(): Observable<Aeronef[]>
    {
        return this.http.get<Aeronef[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerLeger(): Observable<AeronefLeger[]>
    {
        return this.http.get<AeronefLeger[]>(`${this.BASE_API}/lister-leger`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerVaisseauCompatiblePlaceDisponible(_idAeronef: number): Observable<VaisseauAeronefPlaceDisponible[]>
    {
        return this.http.get<VaisseauAeronefPlaceDisponible[]>(`${this.BASE_API}/lister-vaisseau-compatible/${_idAeronef}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_aeronef: AeronefRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/ajouter`, _aeronef).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Acheter(_idAeronef: number, _listeAchat: AeronefAchatRequete[]): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/acheter/${_idAeronef}`, _listeAchat).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idAeronef: number, _aeronef: AeronefRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idAeronef}`, _aeronef).pipe(takeUntilDestroyed(this.destroyRef));
    }
}