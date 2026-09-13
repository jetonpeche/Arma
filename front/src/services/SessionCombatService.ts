import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ModifierDecorTransformRequete, ModifierFondTransformRequete, ModifierPionTransformRequete } from "@models/SessionCombat";

export class SessionCombatService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/session`;

    NouvelleSession(_nom: string): Observable<number>
    {
        const INFO = { nom: _nom };
        return this.http.post<number>(`${this.BASE_API}/initialiser`, INFO).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterFond(_fichier: File, _hauteur: number, _largeur: number): Observable<string>
    {
        const FORM_DATA = new FormData();
        FORM_DATA.append("Fichier", _fichier, _fichier.name);
        FORM_DATA.append("Hauteur", _hauteur.toString());
        FORM_DATA.append("Hauteur", _hauteur.toString());

        return this.http.post<string>(`${this.BASE_API}/upload-fond`, FORM_DATA).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierFondTransform(_idSession: number, _transform: ModifierFondTransformRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier-fond-transform/${_idSession}`, _transform).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierDecorTransform(_idSession: number, _transform: ModifierDecorTransformRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier-decor-transform/${_idSession}`, _transform).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierPionTransform(_idSession: number, _transform: ModifierPionTransformRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier-pion-transform/${_idSession}`, _transform).pipe(takeUntilDestroyed(this.destroyRef));
    }
}