import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { VaisseauPossederAeronef } from '@models/VaisseauPosseder';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { InputNumber, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { VaisseauService } from '@services/VaisseauService';
import { SnackBarService } from '@services/SnackBarService';
import { Subject, takeUntil } from 'rxjs'; 

type AeronefVaisseauModifier = 
{
    idVaisseauPosseder: number,
    aeronef: VaisseauPossederAeronef
}

@Component({
  selector: 'app-modal-modifier-aeronef',
  imports: [MatDialogModule, MatButtonModule, GridContainer, GridElement, InputNumber, ReactiveFormsModule, ButtonLoader],
  templateUrl: './modal-modifier-aeronef.html',
  styleUrl: './modal-modifier-aeronef.scss',
})
export class ModalModifierAeronef implements OnInit, OnDestroy
{
    protected form: FormGroup;
    protected dialogData: AeronefVaisseauModifier = inject(MAT_DIALOG_DATA);
    protected btnClick = signal(false);

    private vaisseauServ = inject(VaisseauService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<ModalModifierAeronef>);
    private destroy$ = new Subject<void>(); 

    ngOnInit(): void
    {
        const max = this.dialogData.aeronef.nombreMax;
        
        this.form = new FormGroup({
            idAeronef: new FormControl(this.dialogData.aeronef.id),
            nombreDisponible: new FormControl(this.dialogData.aeronef.nombreDisponible, [Validators.min(0), Validators.max(max)]),
            nombreSortie: new FormControl(this.dialogData.aeronef.nombreSortie || 0, [Validators.min(0), Validators.max(max)]),
            nombreDetruit: new FormControl(this.dialogData.aeronef.nombreDetruit, [Validators.min(0), Validators.max(max)])
        });

        this.InitialiserCalculAutomatique();
    }

    private InitialiserCalculAutomatique(): void
    {
        const max = this.dialogData.aeronef.nombreMax;
        const ctrlDispo = this.form.get('nombreDisponible')!;
        const ctrlSortie = this.form.get('nombreSortie')!;
        const ctrlDetruit = this.form.get('nombreDetruit')!;

        const ajusterValeurs = (source: 'dispo' | 'sortie' | 'detruit', valeur: number) => {
            let dispo = ctrlDispo.value || 0;
            let sortie = ctrlSortie.value || 0;
            let detruit = ctrlDetruit.value || 0;

            if (valeur > max) 
                valeur = max;

            if (source === 'detruit') 
            {
                detruit = valeur;
                // Si plus de vaisseaux abattus, on réduit le hangar (dispo) en priorité
                dispo = max - detruit - sortie;
                if (dispo < 0) 
                {
                    sortie += dispo; // Si on a vidé le hangar, on déduit des escadrons en vol
                    dispo = 0;
                }
            } 
            else if (source === 'sortie') 
            {
                sortie = valeur;
                // Si on lance un escadron (sortie), on vide le hangar (dispo)
                dispo = max - detruit - sortie;
                if (dispo < 0) 
                {
                    detruit += dispo; // Sécurité extrême (ne devrait pas arriver en usage normal)
                    dispo = 0;
                }
            } 
            else if (source === 'dispo') 
            {
                dispo = valeur;
                // Si des appareils rentrent au hangar, on réduit les effectifs sortie
                sortie = max - dispo - detruit;
                if (sortie < 0) 
                {
                    detruit += sortie;
                    sortie = 0;
                }
            }

            ctrlDispo.setValue(dispo, { emitEvent: false });
            ctrlSortie.setValue(sortie, { emitEvent: false });
            ctrlDetruit.setValue(detruit, { emitEvent: false });
        };

        // Écoutes des senseurs sur chaque champ
        ctrlDetruit.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => ajusterValeurs('detruit', val));
        ctrlSortie.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => ajusterValeurs('sortie', val));
        ctrlDispo.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => ajusterValeurs('dispo', val));
    }

    protected Valider(): void
    {
        if(this.form.invalid)
        {
            this.snackBarServ.Erreur("Données d'escadron invalides. Vérifiez la télémétrie");
            return;
        }

        this.btnClick.set(true);

        this.vaisseauServ.ModifierAeronefPosseder(this.dialogData.idVaisseauPosseder, this.form.value).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.snackBarServ.Ok("Statut de l'escadron mis à jour");
                this.dialogRef.close(true);
            }, error: () => this.btnClick.set(false)
        });
    }

    ngOnDestroy(): void 
    {
        this.destroy$.next();
        this.destroy$.complete();
    }
}