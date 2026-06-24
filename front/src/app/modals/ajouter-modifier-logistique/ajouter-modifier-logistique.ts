import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AutocompleteDataSource, ButtonLoader, InputText, InputNumber, InputAutocomplete } from '@jetonpeche/angular-mat-input';
import { Logistique, TypeLogistique, TypeStockageLogistique } from '@models/Logistique';
import { SnackBarService } from '@services/SnackBarService';
import { TypeLogistiqueService } from '@services/TypeLogistiqueService';
import { TypeStockageLogistiqueService } from '@services/TypeStockageLogistiqueService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LogistiqueService } from '@services/LogistiqueService';

@Component({
    selector: 'app-ajouter-modifier-logistique',
    imports: [MatCheckboxModule, MatDialogModule, InputText, ButtonLoader, ReactiveFormsModule, GridContainer, GridElement, InputNumber, InputAutocomplete],
    templateUrl: './ajouter-modifier-logistique.html',
    styleUrl: './ajouter-modifier-logistique.scss',
})
export class AjouterModifierLogistique implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected dataSourceTypeLogistique = signal<AutocompleteDataSource[]>([]);
    protected dataSourceTypeStockageLogistique = signal<AutocompleteDataSource[]>([]);

    private matDialogData: Logistique = inject(MAT_DIALOG_DATA);
    private typeLogistiqueServ = inject(TypeLogistiqueService);
    private typeStockageLogistiqueServ = inject(TypeStockageLogistiqueService);
    private logistiqueServ = inject(LogistiqueService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierLogistique>);

    ngOnInit(): void 
    {
        this.ListerType();
        this.ListerTypeStockage();

        if(this.matDialogData)
            this.labelBtn.set("Modifier");

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            prix: new FormControl(this.matDialogData?.prix ?? 1, [Validators.required, Validators.min(1)]),
            stock: new FormControl(this.matDialogData?.stock ?? 0, [Validators.required, Validators.min(0)]),
            nbDetruit: new FormControl(
                this.matDialogData?.nbDetruit ?? 0, 
                [Validators.required, Validators.min(0)]
            ),
            tailleUnitaireInventaire: new FormControl(
                this.matDialogData?.tailleUnitaireInventaire ?? 1, 
                [Validators.required, Validators.min(0)]
            ),
            estKit: new FormControl(this.matDialogData?.estKit ?? false),
            ignoreTypeStockage: new FormControl(this.matDialogData?.ignoreTypeStockage ?? false),
            idType: new FormControl(this.matDialogData?.type.id ?? 0, [Validators.required]),
            idTypeStockage: new FormControl(
                this.matDialogData?.typeStockage.id ?? 0, 
                [Validators.required]
            )
        });
    }

    protected ValiderForm(): void 
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.logistiqueServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () => 
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("L'objet a été modifié");
                    this.dialogRef.close(true);
                },
                error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.logistiqueServ.Ajouter(this.form.value).subscribe({
                next: () => 
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("L'objet a été créé");
                    this.dialogRef.close(true);
                },
                error: () => this.btnClick.set(false)
            });
        }
    }

    private ListerTypeStockage(): void
    {
        this.typeStockageLogistiqueServ.Lister().subscribe({
            next: (retour: TypeStockageLogistique[]) => 
            {
                this.dataSourceTypeStockageLogistique.set(retour.map(x => ({ value: x.id, display: x.nom })));
            }
        });
    }

    private ListerType(): void
    {
        this.typeLogistiqueServ.Lister().subscribe({
            next: (retour: TypeLogistique[]) => 
            {
                this.dataSourceTypeLogistique.set(retour.map(x => ({ value: x.id, display: x.nom })));
            }
        });
    }
}
