import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader, InputTextarea } from "@jetonpeche/angular-mat-input";
import { PlaneteOrigine } from '@models/PlaneteOrigine';
import { PlaneteService } from '@services/PlaneteService';
import { SnackBarService } from '@services/SnackBarService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { EAppartenancePlanete, EStatusPlanete, ETypePlanete } from '@enums/EStatusPlanete';
import { MatSelectModule } from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';

@Component({
    selector: 'app-ajouter-modifier-planete-origine',
    imports: [MatCheckboxModule, MatSelectModule, MatDialogModule, InputText, ButtonLoader, ReactiveFormsModule, InputTextarea, GridContainer, GridElement],
    templateUrl: './ajouter-modifier-planete-origine.html',
})
export class AjouterModifierPlaneteOrigine implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected listeType = [
        { valeur: ETypePlanete.Asteroide, nom: "Asteroide" },
        { valeur: ETypePlanete.Halo, nom: "Halo" },
        { valeur: ETypePlanete.Lune, nom: "Lune" },
        { valeur: ETypePlanete.Planete, nom: "Planete" },
        { valeur: ETypePlanete.Soleil, nom: "Soleil" },
        { valeur: ETypePlanete.StationCivil, nom: "Station civil" },
        { valeur: ETypePlanete.StationMilitaire, nom: "Station militaire" }
    ];

    protected listeAppartenance = [
        { valeur: EAppartenancePlanete.Humain, nom: "Humain" },
        { valeur: EAppartenancePlanete.UNSC, nom: "UNSC" },
        { valeur: EAppartenancePlanete.Convenant, nom: "Convenant" },
        { valeur: EAppartenancePlanete.Insurrection, nom: "Insurrection" },
        { valeur: EAppartenancePlanete.Brute, nom: "Brute" },
        { valeur: EAppartenancePlanete.Parasite, nom: "Parasite" },
        { valeur: EAppartenancePlanete.Foreneur, nom: "Foreneur" },
        { valeur: EAppartenancePlanete.ClassifierONI, nom: "Classifier O.N.I" },
        { valeur: EAppartenancePlanete.Neutre, nom: "Neutre" }
    ];

    protected listeStatuts = [
        { valeur: EStatusPlanete.Vitrifier, nom: "Vitrifiée" },
        { valeur: EStatusPlanete.VitrifierPartielle, nom: "Vitrification Partielle" },
        { valeur: EStatusPlanete.EnGuerre, nom:  "En Guerre" },
        { valeur: EStatusPlanete.EnPaix, nom:  "En Paix" },
        { valeur: EStatusPlanete.RocheSpatial, nom:  "Roche Spatiale" },
        { valeur: EStatusPlanete.Inhabiter, nom: "Inhabité" },
        { valeur: EStatusPlanete.ControlPartiel, nom: "Contrôle Partiel" },
        { valeur: EStatusPlanete.ControlTotal, nom:  "Contrôle Total" },
        { valeur: EStatusPlanete.ClassifierONI, nom: "Classifié O.N.I." }
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
            statut: new FormControl(this.matDialogData?.statut ?? EStatusPlanete.Inhabiter, [Validators.required]),
            appartenance: new FormControl(this.matDialogData?.appartenance ?? EAppartenancePlanete.Neutre, [Validators.required]),
            type: new FormControl(this.matDialogData?.type ?? ETypePlanete.Planete, [Validators.required]),
            densite: new FormControl(this.matDialogData?.densite ?? 1, [Validators.required]),
            estPlaneteOrigine: new FormControl(this.matDialogData?.estPlaneteOrigine ?? false),

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
                        appartenance: FORM.appartenance,
                        type: FORM.type,
                        densite: FORM.densite,
                        estPlaneteOrigine: FORM.estPlaneteOrigine,
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
                        appartenance: FORM.appartenance,
                        type: FORM.type,
                        densite: FORM.densite,
                        estPlaneteOrigine: FORM.estPlaneteOrigine,
                        positionX: FORM.positionX,
                        positionY: FORM.positionY
                    } as PlaneteOrigine);

                }, error: () => this.btnClick.set(false)
            });
        }
    }
}
