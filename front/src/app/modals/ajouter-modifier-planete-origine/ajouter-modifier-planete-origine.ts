import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader, InputTextarea } from "@jetonpeche/angular-mat-input";
import { PlaneteOrigine } from '@models/PlaneteOrigine';
import { PlaneteService } from '@services/PlaneteService';
import { SnackBarService } from '@services/SnackBarService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { EStatusPlanete } from '@enums/EStatusPlanete';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-ajouter-modifier-planete-origine',
    imports: [MatSelectModule, MatDialogModule, InputText, ButtonLoader, ReactiveFormsModule, InputTextarea, GridContainer, GridElement],
    templateUrl: './ajouter-modifier-planete-origine.html',
})
export class AjouterModifierPlaneteOrigine implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected listeStatuts = [
        { valeur: EStatusPlanete.ControleUNSC, nom: "Contrôle UNSC" },
        { valeur: EStatusPlanete.ControleCvenante, nom: "Contrôle Covenant" },
        { valeur: EStatusPlanete.InsurrectionPartielle, nom: "Insurrection partielle" },
        { valeur: EStatusPlanete.InsurrectionTotal, nom: "Insurrection totale" },
        { valeur: EStatusPlanete.Neutre, nom: "Système Neutre" },
        { valeur: EStatusPlanete.Inconnu, nom: "Statut Inconnu" },
        { valeur: EStatusPlanete.HorsRegistre, nom: "Hors Registre (O.N.I.)" },
        { valeur: EStatusPlanete.EnGuerre, nom: "Zone de Guerre Active" },
        { valeur: EStatusPlanete.Vitrifier, nom: "Vitrifiée" },
        { valeur: EStatusPlanete.VitrifierPartielle, nom: "Vitrification Partielle" }
    ];

    private matDialogData: PlaneteOrigine = inject(MAT_DIALOG_DATA);
    private planeteServ = inject(PlaneteService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierPlaneteOrigine>);

    ngOnInit(): void 
    {
        if(this.matDialogData?.id)
            this.labelBtn.set("Modifier");

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            description: new FormControl(this.matDialogData?.description ?? "", [Validators.maxLength(400)]),
            statut: new FormControl(this.matDialogData?.statut ?? EStatusPlanete.Neutre, [Validators.required]),

            idSysteme: new FormControl(this.matDialogData.idSysteme),
            positionX: new FormControl(this.matDialogData.positionX),
            positionY: new FormControl(this.matDialogData.positionY)
        });
    }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        const FORM = this.form.value;

        if(this.matDialogData?.id)
        {
            this.planeteServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("La planète a été modifiée");
                    this.btnClick.set(false);

                    this.dialogRef.close({
                        id: this.matDialogData.id,
                        idSysteme: FORM.idSysteme,
                        nom: FORM.nom,
                        description: FORM.description,
                        statut: FORM.statut,
                        positionX: FORM.positionX,
                        positionY: FORM.positionY
                    } as PlaneteOrigine);

                }, error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.planeteServ.Ajouter(this.form.value).subscribe({
                next: (retour) =>
                {
                    this.snackBarServ.Ok("La planète a été ajoutée");
                    this.btnClick.set(false);

                    this.dialogRef.close({
                        id: retour,
                        idSysteme: FORM.idSysteme,
                        nom: FORM.nom,
                        description: FORM.description,
                        statut: FORM.statut,
                        positionX: FORM.positionX,
                        positionY: FORM.positionY
                    } as PlaneteOrigine);

                }, error: () => this.btnClick.set(false)
            });
        }
    }
}
