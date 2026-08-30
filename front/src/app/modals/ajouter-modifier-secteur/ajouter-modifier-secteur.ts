import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonLoader, InputText } from '@jetonpeche/angular-mat-input';
import { Secteur } from '@models/Secteur';
import { SecteurService } from '@services/SecteurService';
import { SnackBarService } from '@services/SnackBarService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";

@Component({
  selector: 'app-ajouter-modifier-secteur',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, ButtonLoader, InputText, GridContainer, GridElement],
  templateUrl: './ajouter-modifier-secteur.html',
  styleUrl: './ajouter-modifier-secteur.scss',
})
export class AjouterModifierSecteur implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);

    private matDialogData: Secteur = inject(MAT_DIALOG_DATA);
    private secteurServ = inject(SecteurService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierSecteur>);

    ngOnInit(): void 
    {
        if(this.matDialogData)
            this.labelBtn.set("Modifier");

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            couleurHexa: new FormControl(this.matDialogData?.couleurHexa ?? "", [Validators.required])
        });
    }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
        {
            this.form.markAllAsTouched();
            return;
        }

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.secteurServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("Le secteur a été modifié");
                    this.dialogRef.close({
                        id: this.matDialogData.id,
                        nom: this.form.value.nom,
                        couleurHexa: this.form.value.couleurHexa
                    } as Secteur);
                },
                error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.secteurServ.Ajouter(this.form.value).subscribe({
                next: (retour) =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("Le secteur a été ajouté");
                    this.dialogRef.close({
                        id: retour,
                        nom: this.form.value.nom,
                        couleurHexa: this.form.value.couleurHexa
                    } as Secteur);
                },
                error: () => this.btnClick.set(false)
            });
        }
    }
}
