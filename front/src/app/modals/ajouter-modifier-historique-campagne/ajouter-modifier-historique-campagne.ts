import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { HistoriqueCampagne } from '@models/HistoriqueCampagne';
import { HistoriqueCampagneService } from '@services/HistoriqueCampagneService';
import { SnackBarService } from '@services/SnackBarService';
import { InputText, InputTextarea, InputFileDropZone, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { FichierService } from '@services/FichierService';
import { ETypeRessource } from '@enums/ETypeRessource';
import { concat, forkJoin, toArray } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ajouter-modifier-historique-campagne',
  imports: [MatButtonModule, MatDialogModule, InputText, ɵInternalFormsSharedModule, ReactiveFormsModule, InputTextarea, InputFileDropZone, ButtonLoader],
  templateUrl: './ajouter-modifier-historique-campagne.html',
  styleUrl: './ajouter-modifier-historique-campagne.scss',
})
export class AjouterModifierHistoriqueCampagne implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);

    private matDialogData = inject<HistoriqueCampagne>(MAT_DIALOG_DATA);
    private historiqueCampagneServ = inject(HistoriqueCampagneService);
    private fichierServ = inject(FichierService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierHistoriqueCampagne>);
    private listeFichier: FileList;

    ngOnInit(): void 
    {
        if(this.matDialogData)
            this.labelBtn.set("Modifier");

        this.form = new FormGroup({
            titre: new FormControl(this.matDialogData?.titre ?? "", [Validators.required, Validators.maxLength(120)]),
            texte: new FormControl(this.matDialogData?.texte ?? "", [Validators.required, Validators.maxLength(1_000)])
        })
    }

    protected FichierChoisi(_listeFichier: FileList): void
    {
        this.listeFichier = _listeFichier;
    }

    protected Valider(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.historiqueCampagneServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);

                    if(this.listeFichier.length == 0 || !this.listeFichier)
                    {
                        this.dialogRef.close(true);
                        return;
                    }

                    const uploads = Array.from(this.listeFichier).map(element => 
                        this.fichierServ.Upload(this.matDialogData.id, ETypeRessource.HistoriqueCampagne, element)
                    );

                    // equivalent Task.WhenAll
                    forkJoin(uploads).subscribe({
                        next: () => 
                        {
                            this.btnClick.set(false);
                            this.snackBarServ.Ok("La campagne a été modifiée");                          
                            this.dialogRef.close(true);
                        },
                        error: () => this.btnClick.set(false)
                    });

                }, error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.historiqueCampagneServ.Ajouter(this.form.value).subscribe({
                next: (id) =>
                {
                    const uploads = Array.from(this.listeFichier).map(element => 
                        this.fichierServ.Upload(id, ETypeRessource.HistoriqueCampagne, element)
                    );

                    concat(...uploads).pipe(
                        toArray()
                    ).subscribe({
                        next: () => 
                        {
                            this.btnClick.set(false);
                            this.snackBarServ.Ok("Tous les fichiers ont été enregistrés avec succès.");
                            this.dialogRef.close(true);
                        },
                        error: () =>
                        {
                            this.btnClick.set(false);
                            this.snackBarServ.Erreur("Une erreur est survenue lors de l'envoi des fichiers.");
                        }
                    });

                    this.btnClick.set(false);
                },
                error: () => this.btnClick.set(false)
            });
        }
    }
}
