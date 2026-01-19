import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader, InputNumber, InputTextarea, InputAutocomplete, AutocompleteDataSource } from "@jetonpeche/angular-mat-input";
import { Vaisseau, VaisseauArmement, VaisseauStockage } from '@models/Vaisseau';
import { SnackBarService } from '@services/SnackBarService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatExpansionModule} from '@angular/material/expansion';
import { TypeStockageLogistiqueService } from '@services/TypeStockageLogistiqueService';

@Component({
  selector: 'app-ajouter-modifier-vaisseau',
  imports: [MatExpansionModule, MatCheckboxModule, MatDialogModule, ReactiveFormsModule, InputText, ButtonLoader, GridContainer, GridElement, InputNumber, InputTextarea, InputAutocomplete],
  templateUrl: './ajouter-modifier-vaisseau.html',
  styleUrl: './ajouter-modifier-vaisseau.scss',
})
export class AjouterModifierVaisseau implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected dataSourceTypeStockage = signal<AutocompleteDataSource[]>([]);

    private matDialogData: Vaisseau = inject(MAT_DIALOG_DATA);

    private typeStockageServ = inject(TypeStockageLogistiqueService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierVaisseau>);

    get listeArmement(): FormArray 
    {
        return this.form.get('listeArmement') as FormArray;
    }

    get listeStockage(): FormArray 
    {
        return this.form.get('listeStockage') as FormArray;
    }

    ngOnInit(): void
    {
        this.ListerTypeStockage();

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            prix: new FormControl(this.matDialogData?.prix ?? 1, [Validators.required, Validators.min(1)]),
            stock: new FormControl(this.matDialogData?.stock ?? 0, [Validators.required, Validators.min(0)]),
            role: new FormControl(this.matDialogData?.role ?? "", [Validators.required, Validators.maxLength(300)]),
            capaciteSpeciale: new FormControl(this.matDialogData?.capaciteSpeciale, [Validators.maxLength(300)]),
            vitesse: new FormControl(this.matDialogData?.vitesse ?? "", [Validators.required, Validators.maxLength(50)]),
            blindage: new FormControl(this.matDialogData?.blindage ?? "", [Validators.required, Validators.maxLength(50)]),
            equipage: new FormGroup({
                nbPlacePassager: new FormControl(
                    this.matDialogData?.equipage.nbPlacePassager ?? 0, 
                    [Validators.required, Validators.min(0)]
                ),
                nbPlaceMarines: new FormControl(
                    this.matDialogData?.equipage.nbPlaceMarines ?? 0, 
                    [Validators.required, Validators.min(0)]
                )
            }),
            listeStockage: new FormArray([]),
            listeArmement: new FormArray([])
        });

        if(this.matDialogData)
        {
            this.labelBtn.set("Modifier");

            for (const element of this.matDialogData.listeArmement) 
                this.AjouterArmement(element);    
            
            for (const element of this.matDialogData.listeStockage) 
                this.AjouterStockage(element);  
        }
    }

    protected AjouterArmement(_armement?: VaisseauArmement): void
    {
        this.listeArmement.push(new FormGroup({
            nom: new FormControl(_armement?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            information: new FormControl(_armement?.information, [Validators.maxLength(1000)]),
            nombre: new FormControl(_armement?.nombre ?? 1, [Validators.required, Validators.min(1)]),
            munition: new FormControl(_armement?.munition ?? 0, [Validators.required, Validators.min(0)]),
            nbTourReload: new FormControl(_armement?.nbTourReload ?? 0, [Validators.required, Validators.min(0)]),
            munitionInifini: new FormControl(_armement?.munitionInifini ?? false, [Validators.required]),
            estUsageUnique: new FormControl(_armement?.estUsageUnique ?? false, [Validators.required])
        }));
    }

    protected AjouterStockage(_stockage?: VaisseauStockage): void
    {
        this.listeStockage.push(new FormGroup({
            id: new FormControl(_stockage?.id),
            idTypeStockage: new FormControl(_stockage?.typeStockage.id ?? 0, [Validators.required]),
            nom: new FormControl(_stockage?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            taille: new FormControl(_stockage?.taille, [Validators.min(1)]),
        }));
    }

    protected SupprimerArmement(_index: number): void
    {
        this.listeArmement.removeAt(_index);
    }

    protected SupprimerStockage(_index: number): void
    {
        this.listeStockage.removeAt(_index);
    }

    protected ValiderForm(): void
    {
        console.log(this.form.valid);
        console.log(this.form);
        
        
    }

    private ListerTypeStockage(): void
    {
        this.typeStockageServ.Lister().subscribe({
            next: (retour) =>
            {
                this.dataSourceTypeStockage.set(
                    retour.map(x => ({ value: x.id, display: x.nom }))
                );
            }
        });
    }
}
