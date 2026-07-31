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
        this.form = new FormGroup({
            idArmement: new FormControl(this.dialogData.armement.id),
            nombreDisponible: new FormControl(this.dialogData.armement.nombreDisponible, [Validators.min(0), Validators.max(max)]),
            nombreDetruit: new FormControl(this.dialogData.armement.nombreDetruit, [Validators.min(0), Validators.max(max)])
        });

        this.InitialiserCalculAutomatique();
    }

    private InitialiserCalculAutomatique(): void
    {
        const max = this.dialogData.armement.nombreMax;
        const ctrlDispo = this.form.get('nombreDisponible')!;
        const ctrlDetruit = this.form.get('nombreDetruit')!;

        // Écoute des modifications sur le nombre DISPONIBLE
        ctrlDetruit.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((detruit: number) => 
        {
            if (detruit !== null) 
            {
                let valeurSecurisee = detruit;

                if (detruit > max) 
                {
                    valeurSecurisee = max;
                    ctrlDetruit.setValue(valeurSecurisee, { emitEvent: false });
                }

                const nouveauDispo = Math.max(0, max - valeurSecurisee);
                ctrlDispo.setValue(nouveauDispo, { emitEvent: false });
            }
        });

        // Écoute des modifications sur le nombre DISPONIBLE
        ctrlDispo.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((disponible: number) => 
        {
            if (disponible !== null) 
            {
                let valeurSecurisee = disponible;

                if (disponible > max) 
                {
                    valeurSecurisee = max;
                    ctrlDispo.setValue(valeurSecurisee, { emitEvent: false });
                }

                const nouveauDetruit = Math.max(0, max - valeurSecurisee);
                ctrlDetruit.setValue(nouveauDetruit, { emitEvent: false });
            }
        });
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