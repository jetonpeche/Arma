import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader, InputTextarea } from "@jetonpeche/angular-mat-input";
import { PlaneteOrigine } from '@models/PlaneteOrigine';
import { SnackBarService } from '@services/SnackBarService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatSelectModule } from '@angular/material/select';
import { EStatutAsteroide } from '@enums/EStatusAsteroide';
import { AsteroideService } from '@services/AsteroideService';
import { Asteroide } from '@models/Asteroide';

@Component({
  selector: 'app-ajouter-modifier-asteroide',
    imports: [MatSelectModule, MatDialogModule, InputText, ButtonLoader, ReactiveFormsModule, InputTextarea, GridContainer, GridElement],
  templateUrl: './ajouter-modifier-asteroide.html',
  styleUrl: './ajouter-modifier-asteroide.scss',
})
export class AjouterModifierAsteroide implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected listeStatuts = [
        { valeur: EStatutAsteroide.Neutre, nom: "Roche spatiale standard" },
        { valeur: EStatutAsteroide.Coloniser, nom: "Colonisé" },
        { valeur: EStatutAsteroide.HorsRegistre, nom: "Hors Registre (O.N.I.)" }
    ];

    private matDialogData: PlaneteOrigine = inject(MAT_DIALOG_DATA);
    private asteroideServ = inject(AsteroideService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierAsteroide>);

    ngOnInit(): void
    {
        if(this.matDialogData?.id)
            this.labelBtn.set("Modifier");

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            description: new FormControl(this.matDialogData?.description ?? "", [Validators.maxLength(400)]),
            statut: new FormControl(this.matDialogData?.statut ?? EStatutAsteroide.Neutre, [Validators.required]),

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
            this.asteroideServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("L'astéroide a été modifié");
                    this.btnClick.set(false);

                    this.dialogRef.close({
                        id: this.matDialogData.id,
                        idSysteme: FORM.idSysteme,
                        nom: FORM.nom,
                        description: FORM.description,
                        statut: FORM.statut,
                        positionX: FORM.positionX,
                        positionY: FORM.positionY
                    } as Asteroide);

                }, error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.asteroideServ.Ajouter(this.form.value).subscribe({
                next: (retour) =>
                {
                    this.snackBarServ.Ok("L'astéroide a été ajouté");
                    this.btnClick.set(false);

                    this.dialogRef.close({
                        id: retour,
                        idSysteme: FORM.idSysteme,
                        nom: FORM.nom,
                        description: FORM.description,
                        statut: FORM.statut,
                        positionX: FORM.positionX,
                        positionY: FORM.positionY
                    } as Asteroide);

                }, error: () => this.btnClick.set(false)
            });
        }
    }
}
