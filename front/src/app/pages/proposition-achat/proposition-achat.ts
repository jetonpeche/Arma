import { AfterViewInit, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { DecisionAchatRequete, ObjetProposer, PropositionAchat } from '@models/PropositionAchat';
import { PropositionAchatService } from '@services/PropositionAchatService';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { SnackBarService } from '@services/SnackBarService';
import { MatSelectModule } from "@angular/material/select";
import { AutocompleteDataSource, InputAutocomplete, ButtonLoader } from '@jetonpeche/angular-mat-input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ETypeObjetProposer } from '@enums/ETypeObjetProposer';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { AuthentificationService } from '@services/AuthentificationService';
import { Droit } from '@models/DroitGroupe';
import { EUrl } from '@enums/EUrl';

@Component({
  selector: 'app-proposition-achat',
  imports: [MatSelectModule, MatSortModule, MatPaginatorModule, MatTableModule, InputAutocomplete, ReactiveFormsModule, ButtonLoader],
  templateUrl: './proposition-achat.html',
  styleUrl: './proposition-achat.scss',
})
export class PropositionAchatPage implements OnInit, AfterViewInit
{
    protected formControl = new FormControl();
    protected matSort = viewChild.required(MatSort);
    protected matPaginator = viewChild.required(MatPaginator);

    protected listePropositionAutoCompleteAuteur = signal<AutocompleteDataSource[]>([]);
    protected displayedColumns = ["nom", "type", "quantite", "prixUnitaire", "prixTotal", "action"];
    protected dataSource = signal(new MatTableDataSource<ObjetProposer>());
    protected btnClick = signal<boolean>(false);
    protected eTypeObjetProposer = ETypeObjetProposer;
    protected droit: Droit;
    protected idPropositionSelectionner = signal<number>(0);
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

    /** Utiliser pour declancher le prixTotal computed */
    private liste = signal<ObjetProposer[]>([]);

    ngOnInit(): void
    {
        this.Lister();
        this.droit = this.authServ.RecupererDroit(EUrl.PropositionAchat);
    }

    ngAfterViewInit(): void 
    {
        this.matPaginator()._intl.itemsPerPageLabel = "Objet proposé par page";

        this.dataSource.update(x => {
            x.sort = this.matSort();
            x.paginator = this.matPaginator();

            return x;
        });

        this.formControl.valueChanges.subscribe({
            next: (id) =>
            {
                if(id == 0)
                    return;

                const PROPOSITION = this.listePropositionAchat().find(y => y.id == id);

                this.idPropositionSelectionner.set(PROPOSITION.id)
                this.liste.set(PROPOSITION.liste);

                this.dataSource.update(x => {
                    x.data = PROPOSITION.liste

                    return x;
                });
            }
        });
    }

    protected OuvrirModalConfirmationObjet(_objet: ObjetProposer, _decision: boolean): void
    {
        const TITRE = `${ _decision ? 'Valider' : 'Refuser' } l'achat de`;
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
                    this.snackBarServ.Ok(`${_objet.nom} a été ${_decision ? 'acheté(e)' : 'refusé(e)'}`);
                else
                    this.snackBarServ.Ok(`La proposition a été ${_decision ? 'acceptée' : 'refusée'}`);

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

                ELEMENT.liste = ELEMENT.liste.filter(y => !(y.idType == _objet.idType && y.type == _objet.type));

                return x;
            });

            this.liste.update(x =>
                x.filter(y => !(y.idType == _objet.idType && y.type == _objet.type))
            );

            if(this.liste().length == 0)
                this.MiseAjourListePropositionAchat(null);

            this.dataSource.update(x => {
                x.data = this.liste()
                return x;
            });
        }
        else
        {  
            this.listePropositionAchat.set(
                this.listePropositionAchat().filter(x => x.id != this.idPropositionSelectionner())
            );
        
            if(this.listePropositionAchat().length == 0)
            {
                this.liste.set([]);
                this.formControl.setValue(0);
                this.idPropositionSelectionner.set(0);
                this.listePropositionAutoCompleteAuteur.set([]);
                this.dataSource.update(x => {
                    x.data = []
                    return x;
                });
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
                if(retour.length == 0)
                    return;

                this.listePropositionAchat.set(retour);

                const PROPOSITION = this.listePropositionAchat()[0];
                this.idPropositionSelectionner.set(PROPOSITION.id)
                this.liste.set(PROPOSITION.liste);

                this.listePropositionAutoCompleteAuteur.set(
                    retour.map(x => ({ value: x.id, display: `Proposition de ${x.auteur}` }))
                );

                this.formControl.setValue(this.listePropositionAutoCompleteAuteur()[0].value);

                this.dataSource.update(x => {
                    x.data = PROPOSITION.liste

                    return x;
                });
            }
        });
    }
}
