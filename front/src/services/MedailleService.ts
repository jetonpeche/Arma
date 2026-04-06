import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Medaille, MedailleRequete } from "@models/Medaille";

export class MedailleService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/medaille`;

    Lister(): Observable<Medaille[]>
    {
        return this.http.get<Medaille[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_medaille: MedailleRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _medaille).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idMedaille: number, _medaille: MedailleRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idMedaille}`, _medaille).pipe(takeUntilDestroyed(this.destroyRef));
    }
}