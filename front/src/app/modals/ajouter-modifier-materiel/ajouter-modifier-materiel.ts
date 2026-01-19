import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader, InputTextarea, InputNumber, InputAutocomplete, AutocompleteDataSource } from "@jetonpeche/angular-mat-input";
import { Materiel } from '@models/Materiel';
import { MaterielService } from '@services/MaterielService';
import { SnackBarService } from '@services/SnackBarService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { TypeMaterielService } from '@services/TypeMaterielService';

@Component({
  selector: 'app-ajouter-modifier-materiel',
  imports: [MatDialogModule, ReactiveFormsModule, InputText, ButtonLoader, InputTextarea, GridContainer, GridElement, InputNumber, InputAutocomplete],
  templateUrl: './ajouter-modifier-materiel.html',
  styleUrl: './ajouter-modifier-materiel.scss',
})
export class AjouterModifierMateriel implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected dataSource = signal<AutocompleteDataSource[]>([]);

    private matDialogData: Materiel = inject(MAT_DIALOG_DATA);
    private materielServ = inject(MaterielService);
    private typeMaterielServ = inject(TypeMaterielService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierMateriel>);

    ngOnInit(): void 
    {        
        if(this.matDialogData)
            this.labelBtn.set("Modifier");

        this.ListerType();

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            description: new FormControl(this.matDialogData?.description ?? null, [Validators.maxLength(1_000)]),
            prix: new FormControl(this.matDialogData?.prix ?? 1, [Validators.required, Validators.min(1)]),
            stock: new FormControl(this.matDialogData?.stock ?? 0, [Validators.required, Validators.min(0)]),
            nbPlacer: new FormControl(this.matDialogData?.nbPlacer ?? 0, [Validators.required, Validators.min(0)]),
            nbDetruit: new FormControl(this.matDialogData?.nbDetruit ?? 0, [Validators.required, Validators.min(0)]),
            idTypeMateriel: new FormControl(this.matDialogData?.type.id ?? 0, [Validators.required])
        });
    }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.materielServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("Le matériel a été modifié");
                    this.dialogRef.close(true);
                },
                error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.materielServ.Ajouter(this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("Le matériel a été ajouté");
                    this.dialogRef.close(true);
                },
                error: () => this.btnClick.set(false)
            });
        }
    }

    private ListerType(): void
    {
        this.typeMaterielServ.Lister().subscribe({
            next: (retour) =>
            {
                this.dataSource.set(retour.map(x => ({ value: x.id, display: x.nom })));
            }
        });
    }
}
