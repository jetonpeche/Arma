import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Medaille } from '@models/Medaille';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { InputText, InputTextarea, InputFileDropZone, ButtonLoader, InputAutocomplete, AutocompleteDataSource } from "@jetonpeche/angular-mat-input";
import { MedailleService } from '@services/MedailleService';
import { FichierService } from '@services/FichierService';
import { ETypeRessource } from '@enums/ETypeRessource';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ajouter-modifier-medaille',
  imports: [MatButtonModule, MatDialogModule, GridContainer, GridElement, InputText, ReactiveFormsModule, InputTextarea, InputFileDropZone, ButtonLoader, InputAutocomplete],
  templateUrl: './ajouter-modifier-medaille.html',
  styleUrl: './ajouter-modifier-medaille.scss',
})
export class AjouterModifierMedaille implements OnInit
{
    protected btnLabel = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected form: FormGroup;
    protected listeGroupeMedaille: AutocompleteDataSource[] = [
        { value: 0, display: "Distinction personnelle" },
        { value: 1, display: "Distinction de service" },
        { value: 2, display: "Distinction de campagne" }
    ];

    private matDialogData: Medaille = inject(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<AjouterModifierMedaille>);
    private fichier: File = null;
    private medailleServ = inject(MedailleService);
    private fichierServ = inject(FichierService);

    ngOnInit(): void 
    {
        if(this.matDialogData)
            this.btnLabel.set("Modifier");

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(50)]),
            description: new FormControl(this.matDialogData?.description ?? "", [Validators.required, Validators.maxLength(1_000)]),
            nbPoint: new FormControl(0, [Validators.required, Validators.min(0)]),
            groupe: new FormControl(0, [Validators.required])
        });
    }

    protected InitFichier(_liste: FileList): void
    {
        if(_liste.length > 0)
            this.fichier = _liste[0];
    }

    protected Valider(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.medailleServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    if(this.fichier != null)
                        this.UploadFichier(this.matDialogData.id);

                    else
                    {
                        this.btnClick.set(false);
                        this.dialogRef.close(true);
                    }
                },
                error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.medailleServ.Ajouter(this.form.value).subscribe({
                next: (idMedaille) =>
                {
                    if(this.fichier != null)
                        this.UploadFichier(idMedaille);

                    else
                    {
                        this.btnClick.set(false);
                        this.dialogRef.close(true);
                    }
                },
                error: () => this.btnClick.set(false)
            });
        }
    }

    private UploadFichier(_idMedaille: number): void
    {
        this.fichierServ.Upload(_idMedaille, ETypeRessource.Medaille, this.fichier).subscribe({
            next: () => 
            {
                this.btnClick.set(false);
                this.dialogRef.close(true);
            },
            error: () => this.btnClick.set(false)
        });
    }
}
