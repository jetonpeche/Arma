import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ModifierFondTransformRequete } from "@models/SessionCombat";
import { DecorRequete, ModifierDecorTransformRequete } from "@models/Decor";
import { ModifierPionTransformRequete, PionRequete } from "@models/Pion";

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

    AjouterFond(_idSession: number,  _fichier: File, _hauteur: number, _largeur: number): Observable<string>
    {
        const FORM_DATA = new FormData();
        FORM_DATA.append("Fichier", _fichier, _fichier.name);
        FORM_DATA.append("Hauteur", _hauteur.toString());
        FORM_DATA.append("Largeur", _largeur.toString());
        FORM_DATA.append("IdSession", _idSession.toString());

        return this.http.post<string>(`${this.BASE_API}/upload-fond`, FORM_DATA).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterDecor(_decor: DecorRequete): Observable<{idDecor: string, urlImage: string }>
    {
        const FORM_DATA = new FormData();
        FORM_DATA.append("Fichier", _decor.fichier, _decor.fichier.name);
        FORM_DATA.append("PositionX", _decor.positionX.toString());
        FORM_DATA.append("PositionY", _decor.positionY.toString());
        FORM_DATA.append("Echelle", _decor.echelle.toString());
        FORM_DATA.append("OrdreCalque", _decor.ordreCalque.toString());
        FORM_DATA.append("RotationDegres", _decor.rotationDegres.toString());
        FORM_DATA.append("VisibiliteMode", _decor.visibiliteMode.toString());
        FORM_DATA.append("IdSession", _decor.idSession.toString());

        return this.http.post<{idDecor: string, urlImage: string }>(`${this.BASE_API}/upload-decor`, FORM_DATA).pipe(takeUntilDestroyed(this.destroyRef));
    }

    AjouterPion(_idSession: number, _pion: PionRequete): Observable<string>
    {
        return this.http.post<string>(`${this.BASE_API}/ajouter-pion/${_idSession}`, _pion).pipe(takeUntilDestroyed(this.destroyRef));
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

    SupprimerFond(_idSession: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-fond/${_idSession}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerDecor(_idSession: number, _idDecor: string): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-decor/${_idSession}/${_idDecor}`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    SupprimerPion(_idSession: number, _idPion: string): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer-pion/${_idSession}/${_idPion}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}