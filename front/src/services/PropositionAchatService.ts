import { HttpClient } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DecisionAchatRequete, ObjetProposerRequete, PropositionAchat } from "@models/PropositionAchat";

export class PropositionAchatService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/proposition-achat`;

    Lister(): Observable<PropositionAchat[]>
    {
        return this.http.get<PropositionAchat[]>(`${this.BASE_API}/lister`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Ajouter(_listePropositionAchat: ObjetProposerRequete[]): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/ajouter`, _listePropositionAchat).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Acheter(_objetAcheter: ObjetProposerRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/acheter`, _objetAcheter).pipe(takeUntilDestroyed(this.destroyRef));
    }

    DecisionAchat(_decision: DecisionAchatRequete): Observable<number>
    {
        return this.http.post<number>(`${this.BASE_API}/decision-achat`, _decision).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Supprimer(_idPropositionAchat: number): Observable<void>
    {
        return this.http.delete<void>(`${this.BASE_API}/supprimer/${_idPropositionAchat}`).pipe(takeUntilDestroyed(this.destroyRef));
    }
}