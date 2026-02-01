import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DroitGroupe } from '@models/DroitGroupe';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { ButtonLoader, InputText } from "@jetonpeche/angular-mat-input";
import { FormArray, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EUrl } from '@enums/EUrl';
import { DroitGroupeService } from '@services/DroitGroupeService';
import { SnackBarService } from '@services/SnackBarService';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-ajouter-modifier-droit-groupe',
  imports: [MatCheckboxModule, MatDialogModule, GridContainer, ButtonLoader, GridElement, InputText, ReactiveFormsModule],
  templateUrl: './ajouter-modifier-droit-groupe.html',
  styleUrl: './ajouter-modifier-droit-groupe.scss',
})
export class AjouterModifierDroitGroupe implements OnInit
{
    protected labelBtn = signal("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected form: FormGroup;

    private matDialogData: DroitGroupe | null = inject(MAT_DIALOG_DATA);
    private droitGroupeServ = inject(DroitGroupeService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierDroitGroupe>);

    get listeDroit(): FormArray
    {
        return this.form.get("listeDroit") as FormArray;
    }

    ngOnInit(): void 
    {
        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(50)]),
            peutProposerLogistiqueMateriel: new FormControl(this.matDialogData?.peutProposerLogistiqueMateriel ?? false),
            peutAcheterLogistiqueMateriel: new FormControl(this.matDialogData?.peutAcheterLogistiqueMateriel ?? false),
            peutAcheterVaisseau: new FormControl(this.matDialogData?.peutAcheterVaisseau ?? false),
            listeDroit: new FormArray([])
        });

        if(this.matDialogData)
        {
            this.labelBtn.set("Modifier");

            for (const element of this.matDialogData.listeDroit)
            {
                this.listeDroit.push(new FormGroup({
                    routeGroupe: new FormControl(element.routeGroupe),
                    peutLire: new FormControl(element.peutLire),
                    peutEcrire: new FormControl(element.peutEcrire),
                    peutSupprimer: new FormControl(element.peutSupprimer)
                }));
            }
        }
        else
        {
            const LISTE = [
                EUrl.Boutique, EUrl.DroitGroupe, EUrl.Grade, EUrl.Logistique, 
                EUrl.Materiel, EUrl.Personnage, EUrl.PlaneteOrigine, EUrl.PropositionAchat, 
                EUrl.Specialite, EUrl.TypeLogistique, EUrl.TypeMateriel,
                EUrl.TypeStockageLogistique, EUrl.UploadFichier, EUrl.Vaisseau
            ];

            for (const element of LISTE)
            {
                this.listeDroit.push(new FormGroup({
                    routeGroupe: new FormControl(element.replace("/", "")),
                    peutLire: new FormControl(element == EUrl.UploadFichier ? true : false),
                    peutEcrire: new FormControl(false),
                    peutSupprimer: new FormControl(false)
                }));
            }
        }
    }

    protected Valider(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.droitGroupeServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("Le groupe de droit a été modifié");
                    this.btnClick.set(false);

                    this.form.addControl("id", new FormControl(this.matDialogData.id));
                    this.dialogRef.close(this.form.value);
                },
                error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.droitGroupeServ.Ajouter(this.form.value).subscribe({
                next: (idDroitGroupe) =>
                {
                    this.snackBarServ.Ok("Le groupe de droit a été ajouté");
                    this.btnClick.set(false);

                    this.form.addControl("id", new FormControl(idDroitGroupe));
                    this.dialogRef.close(this.form.value);
                },
                error: () => this.btnClick.set(false)
            });
        }
    }
}
