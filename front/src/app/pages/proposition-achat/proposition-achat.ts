import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecisionAchatRequete, ObjetProposer, PropositionAchat } from '@models/PropositionAchat';
import { PropositionAchatService } from '@services/PropositionAchatService';
import { SnackBarService } from '@services/SnackBarService';
import { MatSelectModule } from "@angular/material/select";
import { AutocompleteDataSource, InputAutocomplete, ButtonLoader } from '@jetonpeche/angular-mat-input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ETypeObjetProposer } from '@enums/ETypeObjetProposer';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { AuthentificationService } from '@services/AuthentificationService';
import { Droit } from '@models/DroitGroupe';
import { EUrl } from '@enums/EUrl';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-proposition-achat',
  imports: [MatSelectModule, InputAutocomplete, ReactiveFormsModule, ButtonLoader, MatIconModule, MatButtonModule, MatTooltipModule, NgTemplateOutlet],
  templateUrl: './proposition-achat.html',
  styleUrl: './proposition-achat.scss',
})
export class PropositionAchatPage implements OnInit
{
    protected formControl = new FormControl();
    protected listePropositionAutoCompleteAuteur = signal<AutocompleteDataSource[]>([]);
    protected btnClick = signal<boolean>(false);
    protected eTypeObjetProposer = ETypeObjetProposer;
    protected droit: Droit;
    protected idPropositionSelectionner = signal<number>(0);
    
    // Le signal liste contient directement les objets à afficher
    protected liste = signal<ObjetProposer[]>([]);

    protected listeMateriel = computed(() => this.liste().filter(x => x.type == this.eTypeObjetProposer.Materiel));
    protected listeLogistique = computed(() => this.liste().filter(x => x.type == this.eTypeObjetProposer.Logistique));

    protected prixTotal = computed(() => 
        this.liste().reduce(
            (accumulateur, valeur) => accumulateur + (valeur.prixUnitaire * valeur.quantite), 0
        )
    );

    private listePropositionAchat = signal<PropositionAchat[]>([]);
    private propositionAchatServ = inject(PropositionAchatService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private authServ = inject(AuthentificationService);
    private snackBarServ = inject(SnackBarService);

    ngOnInit(): void
    {
        this.droit = this.authServ.RecupererDroit(EUrl.PropositionAchat);
        this.Lister();

        // Écoute des changements de sélection dans l'autocomplete
        this.formControl.valueChanges.subscribe({
            next: (id) =>
            {
                if(id == 0 || !id) return;

                const PROPOSITION = this.listePropositionAchat().find(y => y.id == id);
                if (PROPOSITION) {
                    this.idPropositionSelectionner.set(PROPOSITION.id);
                    this.liste.set(PROPOSITION.liste);
                }
            }
        });
    }

    protected OuvrirModalConfirmationObjet(_objet: ObjetProposer, _decision: boolean): void
    {
        const TITRE = `${ _decision ? 'Valider' : 'Refuser' } l'achat`;
        const MESSAGE = `Confirmez vous ${ _decision ? 'la validation' : 'le refus' } d'achat de ${_objet.nom} ?`;

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.AccepterRefuserProposition(_decision, _objet);
            }
        });
    }

    protected OuvrirModalConfirmation(_decision: boolean): void
    {
        const TITRE = `${ _decision ? 'Valider' : 'Refuser' } la proposition d'achat`;
        const MESSAGE = `Confirmez vous ${ _decision ? 'la validation' : 'le refus' } de la proposition d'achat ?`;

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) => 
            {   
                if(retour)
                    this.AccepterRefuserProposition(_decision);
            }
        });
    }

    private AccepterRefuserProposition(_decision: boolean, _objet?: ObjetProposer): void
    {
        this.btnClick.set(true);

        const INFO: DecisionAchatRequete = {
            idPropositionAchat: this.formControl.value,
            achatEstValider: _decision,
            idType: _objet?.idType ?? null,
            type: _objet?.type ?? null
        };

        this.propositionAchatServ.DecisionAchat(INFO).subscribe({
            next: () =>
            {
                this.btnClick.set(false);

                if(_objet)
                {
                    if(_decision)
                        this.authServ.ModifierPointBanque(_objet.prixUnitaire * _objet.quantite);

                    this.snackBarServ.Ok(`${_objet.nom} a été ${_decision ? 'acheté(e)' : 'refusé(e)'}`);
                }
                else
                {
                    if(_decision)
                        this.authServ.ModifierPointBanque(this.prixTotal());

                    this.snackBarServ.Ok(`La proposition a été ${_decision ? 'acceptée' : 'refusée'}`);
                }

                this.MiseAjourListePropositionAchat(_objet);
            },
            error: () => this.btnClick.set(false)
        });
    }

    private MiseAjourListePropositionAchat(_objet?: ObjetProposer): void
    {
        if(_objet)
        {
            this.listePropositionAchat.update(x => {
                const ELEMENT = x.find(y => y.id == this.idPropositionSelectionner());
                if (ELEMENT) {
                    ELEMENT.liste = ELEMENT.liste.filter(y => !(y.idType == _objet.idType && y.type == _objet.type));
                }
                return x;
            });

            this.liste.update(x =>
                x.filter(y => !(y.idType == _objet.idType && y.type == _objet.type))
            );

            if(this.liste().length == 0)
                this.MiseAjourListePropositionAchat(null);
        }
        else
        {  
            this.listePropositionAchat.set(
                this.listePropositionAchat().filter(x => x.id != this.idPropositionSelectionner())
            );
        
            if(this.listePropositionAchat().length == 0)
            {
                this.liste.set([]);
                this.formControl.setValue(0, {emitEvent: false});
                this.idPropositionSelectionner.set(0);
                this.listePropositionAutoCompleteAuteur.set([]);
            }
            else
            {
                const PROPOSITION = this.listePropositionAchat()[0];
                this.idPropositionSelectionner.set(PROPOSITION.id);
                this.formControl.setValue(PROPOSITION.id);

                this.listePropositionAutoCompleteAuteur.update(
                    x => x.filter(y => y.value != PROPOSITION.id)
                );
            }
        }
    }

    private Lister(): void
    {
        this.propositionAchatServ.Lister().subscribe({
            next: (retour) =>
            {
                if(retour.length == 0) return;

                this.listePropositionAchat.set(retour);

                const PROPOSITION = this.listePropositionAchat()[0];
                this.idPropositionSelectionner.set(PROPOSITION.id)
                this.liste.set(PROPOSITION.liste);

                this.listePropositionAutoCompleteAuteur.set(
                    retour.map(x => ({ value: x.id, display: `Proposition de ${x.auteur}` }))
                );

                this.formControl.setValue(this.listePropositionAutoCompleteAuteur()[0].value);
            }
        });
    }
}