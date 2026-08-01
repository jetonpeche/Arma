import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { VaisseauPossederArmement } from '@models/VaisseauPosseder';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { InputNumber, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { VaisseauService } from '@services/VaisseauService';
import { SnackBarService } from '@services/SnackBarService';
import { Subject, takeUntil } from 'rxjs'; 

type ArmementVaisseauModifier = 
{
    idVaisseauPosseder: number,
    armement: VaisseauPossederArmement
}

@Component({
  selector: 'app-modal-modifier-armement',
  imports: [MatDialogModule, MatButtonModule, GridContainer, GridElement, InputNumber, ɵInternalFormsSharedModule, ReactiveFormsModule, ButtonLoader],
  templateUrl: './modal-modifier-armement.html',
  styleUrl: './modal-modifier-armement.scss',
})
export class ModalModifierArmement implements OnInit, OnDestroy
{
    protected form: FormGroup;
    protected dialogData: ArmementVaisseauModifier = inject(MAT_DIALOG_DATA);
    protected btnClick = signal(false);

    private vaisseauServ = inject(VaisseauService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<ModalModifierArmement>);
    private destroy$ = new Subject<void>(); 

    ngOnInit(): void
    {
        const max = this.dialogData.armement.nombreMax;
        
        // Initialisation avec la nouvelle propriété nombreUtilise
        this.form = new FormGroup({
            idArmement: new FormControl(this.dialogData.armement.id),
            nombreDisponible: new FormControl(this.dialogData.armement.nombreDisponible, [Validators.min(0), Validators.max(max)]),
            nombreUtiliser: new FormControl(this.dialogData.armement.nombreUtiliser || 0, [Validators.min(0), Validators.max(max)]),
            nombreDetruit: new FormControl(this.dialogData.armement.nombreDetruit, [Validators.min(0), Validators.max(max)])
        });

        this.InitialiserCalculAutomatique();
    }

    private InitialiserCalculAutomatique(): void
    {
        const max = this.dialogData.armement.nombreMax;
        const ctrlDispo = this.form.get('nombreDisponible')!;
        const ctrlUtilise = this.form.get('nombreUtiliser')!;
        const ctrlDetruit = this.form.get('nombreDetruit')!;

        // Fonction centralisée pour ajuster les valeurs logiquement sans dépasser le maximum
        const ajusterValeurs = (source: 'dispo' | 'utilise' | 'detruit', valeur: number) => {
            let dispo = ctrlDispo.value || 0;
            let utilise = ctrlUtilise.value || 0;
            let detruit = ctrlDetruit.value || 0;

            if (valeur > max) valeur = max;

            if (source === 'detruit') 
            {
                detruit = valeur;
                // Si on déclare plus de détruits, on réduit les disponibles en priorité
                dispo = max - detruit - utilise;
                if (dispo < 0) 
                {
                    utilise += dispo; // 'dispo' est négatif, on réduit donc les 'utilisés'
                    dispo = 0;
                }
            } 
            else if (source === 'utilise') 
            {
                utilise = valeur;
                // Si on déclare plus de tirs (utilisés), on réduit les disponibles en priorité
                dispo = max - detruit - utilise;
                if (dispo < 0) 
                {
                    detruit += dispo;
                    dispo = 0;
                }
            } 
            else if (source === 'dispo') 
            {
                dispo = valeur;
                // Si on déclare plus de disponibles (rechargement), on restaure les "utilisés" en priorité
                utilise = max - dispo - detruit;
                if (utilise < 0) 
                {
                    detruit += utilise;
                    utilise = 0;
                }
            }

            ctrlDispo.setValue(dispo, { emitEvent: false });
            ctrlUtilise.setValue(utilise, { emitEvent: false });
            ctrlDetruit.setValue(detruit, { emitEvent: false });
        };

        // Écoutes des changements
        ctrlDetruit.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => ajusterValeurs('detruit', val));
        ctrlUtilise.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => ajusterValeurs('utilise', val));
        ctrlDispo.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => ajusterValeurs('dispo', val));
    }

    protected Valider(): void
    {
        if(this.form.invalid)
        {
            this.snackBarServ.Erreur("Données tactiques invalides. Veuillez corriger les valeurs");
            return;
        }

        this.btnClick.set(true);

        this.vaisseauServ.ModifierArmementPosseder(this.dialogData.idVaisseauPosseder, this.form.value).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.snackBarServ.Ok("Télémétrie d'armement mise à jour");
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