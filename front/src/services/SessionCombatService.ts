import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ModifierFondTransformRequete, SessionCombat } from "@models/SessionCombat";
import { DecorRequete, ModifierDecorTransformRequete } from "@models/Decor";
import { ModifierPionTransformRequete, PionRequete } from "@models/Pion";

export class SessionCombatService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/session`;

    recuperer(): Observable<SessionCombat>
    {
        return this.http.get<SessionCombat>(`${this.BASE_API}/recuperer`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterFond(_fichier: File, _hauteur: number, _largeur: number): Observable<string>
    {
        const FORM_DATA = new FormData();
        FORM_DATA.append("Fichier", _fichier, _fichier.name);
        FORM_DATA.append("Hauteur", _hauteur.toString());
        FORM_DATA.append("Largeur", _largeur.toString());

        return this.http.post<string>(`${this.BASE_API}/upload-fond`, FORM_DATA).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterDecor(_fichier: File, _idBibliotheque: number | null, _nomRecherche: string | null): Observable<{ id: number, urlImage: string }>
    {
        const FORM_DATA = new FormData();
        FORM_DATA.append("Fichier", _fichier, _fichier.name);

        if(_idBibliotheque > 0 && _idBibliotheque != null && _idBibliotheque != undefined)
            FORM_DATA.append("Id", _idBibliotheque.toString());

        if(_nomRecherche != null && _nomRecherche != undefined && _nomRecherche.trim() != "")
            FORM_DATA.append("NomRecherche", _nomRecherche);

        return this.http.post<{ id: number, urlImage: string }>(`${this.BASE_API}/upload-decor`, FORM_DATA).pipe(takeUntilDestroyed(this.destroyRef));
    }

    PlacerDecor(_decor: DecorRequete): Observable<string>
    {
        return this.http.post<string>(`${this.BASE_API}/placer-decor`, _decor).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterPion(_pion: PionRequete): Observable<string>
    {
        return this.http.post<string>(`${this.BASE_API}/ajouter-pion`, _pion).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierFondTransform(_transform: ModifierFondTransformRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier-fond-transform`, _transform).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierDecorTransform(_transform: ModifierDecorTransformRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier-decor-transform`, _transform).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierPionTransform(_transform: ModifierPionTransformRequete): Observable<void>
    {
        return this.http.put<void>(`${this.BASE_API}/modifier-pion-transform`, _transform).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Vider(): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/vider`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerFond(_idSession: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-fond`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerDecor(_idDecor: string): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-decor/${_idDecor}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerPion(_idPion: string): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-pion/${_idPion}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}