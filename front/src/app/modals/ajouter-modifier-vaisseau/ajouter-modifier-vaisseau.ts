import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader, InputNumber, InputTextarea, InputAutocomplete, AutocompleteDataSource } from "@jetonpeche/angular-mat-input";
import { Vaisseau, VaisseauArmement, VaisseauLeger, VaisseauStockage } from '@models/Vaisseau';
import { SnackBarService } from '@services/SnackBarService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatExpansionModule} from '@angular/material/expansion';
import { TypeStockageLogistiqueService } from '@services/TypeStockageLogistiqueService';
import { VaisseauService } from '@services/VaisseauService';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LogistiqueService } from '@services/LogistiqueService';
import { Logistique } from '@models/Logistique';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: 'app-ajouter-modifier-vaisseau',
  imports: [MatFormFieldModule, MatIconModule, MatSelectModule, MatExpansionModule, MatCheckboxModule, MatDialogModule, ReactiveFormsModule, InputText, ButtonLoader, GridContainer, GridElement, InputNumber, InputTextarea, InputAutocomplete, MatButtonModule],
  templateUrl: './ajouter-modifier-vaisseau.html',
  styleUrl: './ajouter-modifier-vaisseau.scss',
})
export class AjouterModifierVaisseau implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected dataSourceTypeStockage = signal<AutocompleteDataSource[]>([]);
    protected listeVaisseauLeger = signal<VaisseauLeger[]>([]);
    protected listeLogistiqueGlobale = signal<Logistique[]>([]);

    private matDialogData: Vaisseau = inject(MAT_DIALOG_DATA);

    private typeStockageServ = inject(TypeStockageLogistiqueService);
    private snackBarServ = inject(SnackBarService);
    private vaisseauServ = inject(VaisseauService);
    private logistiqueServ = inject(LogistiqueService);
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
        this.ListerLogistique();
        this.ListerVaisseauLeger();

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            prix: new FormControl(this.matDialogData?.prix ?? 1, [Validators.required, Validators.min(1)]),
            stock: new FormControl(this.matDialogData?.stock ?? 0, [Validators.required, Validators.min(0)]),
            role: new FormControl(this.matDialogData?.role ?? "", [Validators.required, Validators.maxLength(300)]),
            capaciteSpeciale: new FormControl(this.matDialogData?.capaciteSpeciale, [Validators.maxLength(300)]),
            vitesse: new FormControl(this.matDialogData?.vitesse ?? "", [Validators.required, Validators.maxLength(50)]),
            blindage: new FormControl(this.matDialogData?.blindage ?? "", [Validators.required, Validators.maxLength(50)]),
            bloquerAchat: new FormControl(this.matDialogData?.bloquerAchat ?? false, [Validators.required]),
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
            listeIdVaisseauEnfant: new FormControl<number[]>(this.matDialogData?.listeVaisseauEnfant.map(x => x.id) ?? []),
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

    protected NomVaisseau(_idVaisseau: number): string
    {
        const VAISSEAU = this.listeVaisseauLeger().find(t => t.id === _idVaisseau);
        return VAISSEAU?.nom ?? "";
    }

    protected AjouterArmement(_armement?: VaisseauArmement): void
    {
        this.listeArmement.push(new FormGroup({
            nom: new FormControl(_armement?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            information: new FormControl(_armement?.information, [Validators.maxLength(1000)]),
            nombre: new FormControl(_armement?.nombre ?? 1, [Validators.required, Validators.min(1)]),
            munition: new FormControl(_armement?.munition ?? 0, [Validators.required, Validators.min(0)]),
            nbTourReload: new FormControl(_armement?.nbTourReload ?? 0, [Validators.required, Validators.min(0)]),
            munitionInfini: new FormControl(_armement?.munitionInfini ?? false, [Validators.required]),
            estUsageUnique: new FormControl(_armement?.estUsageUnique ?? false, [Validators.required])
        }));
    }

    protected AjouterStockage(_stockage?: VaisseauStockage): void
    {
        const contenuDefautArray = new FormArray<FormGroup>([]);

        if (_stockage?.contenuParDefaut) 
        {
            for (const item of _stockage.contenuParDefaut) 
            {
                contenuDefautArray.push(new FormGroup({
                    idLogistique: new FormControl(item.idLogistique),
                    nom: new FormControl(item.nom),
                    quantite: new FormControl(item.quantite, [Validators.required, Validators.min(1)]),
                    tailleUnitaireInventaire: new FormControl(0), 
                    ignoreTypeStockage: new FormControl(false)
                }));
            }
        }

        const souteGroup = new FormGroup({
            id: new FormControl(_stockage?.id),
            idTypeStockage: new FormControl(_stockage?.typeStockage?.id ?? 0, [Validators.required]),
            nom: new FormControl(_stockage?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            taille: new FormControl(_stockage?.taille ?? 1, [Validators.min(1)]),
            contenuParDefaut: contenuDefautArray 
        });

        souteGroup.get('idTypeStockage')?.valueChanges.subscribe(() => 
        {
            const contenuArray = souteGroup.get('contenuParDefaut') as FormArray;
        
            for (let i = contenuArray.length - 1; i >= 0; i--) 
            {
                const itemGroup = contenuArray.at(i);
                
                if (itemGroup.get('ignoreTypeStockage')?.value !== true)
                    contenuArray.removeAt(i);
            }
        });

        this.listeStockage.push(souteGroup);
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
        console.log(this.form.value);
        
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.vaisseauServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("Le vaisseau a été modifié");
                    this.btnClick.set(false);
                    this.dialogRef.close();
                },
                error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.vaisseauServ.Ajouter(this.form.value).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("Le vaisseau a été ajouté");
                    this.btnClick.set(false);
                    this.dialogRef.close();
                },
                error: () => this.btnClick.set(false)
            });
        }
    }

    protected RecupererContenuSoute(indexSoute: number): FormArray 
    {
        return this.listeStockage.at(indexSoute).get('contenuParDefaut') as FormArray;
    }

    protected ListerLogistiquesCompatible(_idTypeStockage: number): any[] 
    {
        if (!_idTypeStockage) 
            return [];
        
        return this.listeLogistiqueGlobale().filter(x => 
            x.ignoreTypeStockage || (x.typeStockage && x.typeStockage.id == _idTypeStockage)
        );
    }

    protected SelectionnerLogistique(_indexSoute: number, _event: any): void 
    {
        const logistique = _event.value;
        if (!logistique) 
            return;

        let contenuSoute = this.RecupererContenuSoute(_indexSoute);

        const EXISTE_DEJA = contenuSoute.controls.some(c => c.get('idLogistique')?.value === logistique.id);

        if(EXISTE_DEJA) 
            return; 

        contenuSoute.push(new FormGroup({
            idLogistique: new FormControl(logistique.id),
            nom: new FormControl(logistique.nom),
            tailleUnitaireInventaire: new FormControl(logistique.tailleUnitaireInventaire), 
            quantite: new FormControl(1, [Validators.required, Validators.min(1)]),
            ignoreTypeStockage: new FormControl(logistique.ignoreTypeStockage)
        }));
    }

    protected SupprimerLogistiqueDeSoute(indexSoute: number, indexLogistique: number): void 
    {
        this.RecupererContenuSoute(indexSoute).removeAt(indexLogistique);
    }

    protected CalculerEspaceRestant(indexSoute: number): number 
    {
        const soute = this.listeStockage.at(indexSoute);
        const tailleMax = soute.get('taille')?.value || 1;
        const contenuArray = this.RecupererContenuSoute(indexSoute);
        
        let volumeOccupe = 0;
        for (const item of contenuArray.controls) 
        {
            const tailleU = item.get('tailleUnitaireInventaire')?.value || 0;
            const qte = item.get('quantite')?.value || 0;
            volumeOccupe += (tailleU * qte);
        }

        return tailleMax - volumeOccupe;
    }

    private MettreAJourInformationsSoutes(): void 
    {
        const logistiques = this.listeLogistiqueGlobale();
        if (logistiques.length == 0 || !this.matDialogData) 
            return;

        for (let i = 0; i < this.listeStockage.length; i++) 
        {
            const contenuArray = this.RecupererContenuSoute(i);

            for (let j = 0; j < contenuArray.length; j++) 
            {
                const itemGroup = contenuArray.at(j) as FormGroup;
                const idLogistique = itemGroup.get('idLogistique')?.value;
                
                const logistiqueTrouvee = logistiques.find(l => l.id === idLogistique);
                
                if (logistiqueTrouvee) 
                {
                    itemGroup.patchValue({
                        tailleUnitaireInventaire: logistiqueTrouvee.tailleUnitaireInventaire,
                        ignoreTypeStockage: logistiqueTrouvee.ignoreTypeStockage
                    });
                }
            }
        }
    }

    private ListerLogistique(): void 
    {
        this.logistiqueServ.Lister().subscribe({
            next: (retour) => 
            {
                this.listeLogistiqueGlobale.set(retour);
                this.MettreAJourInformationsSoutes();
            }
        });
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

    private ListerVaisseauLeger(): void
    {
        this.vaisseauServ.ListerLeger().subscribe({
            next: (retour) =>
            {
                if(this.matDialogData)
                    retour = retour.filter(x => x.id != this.matDialogData.id);

                this.listeVaisseauLeger.set(retour);
            }
        });
    }
}
