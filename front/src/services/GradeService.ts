import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Grade, GradeLeger, GradeRequete } from "@models/Grade";

export class GradeService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/grade`;

    Lister(): Observable<Grade[]>
    {
        return this.http.get<Grade[]>(`${this.BASE_API}/lister?leger=false`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ListerLeger(): Observable<GradeLeger[]>
    {
        return this.http.get<GradeLeger[]>(`${this.BASE_API}/lister?leger=true`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_garde: GradeRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _garde).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_idGrade: number, _garde: GradeRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier/${_idGrade}`, _garde).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idGrade: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idGrade}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}