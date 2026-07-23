import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PanierService } from '@services/PanierService';
import { MatIcon } from "@angular/material/icon";
import { VaisseauService } from '@services/VaisseauService';
import { VaisseauPossederStockage, VaisseauPossederStockageCompatible } from '@models/VaisseauPosseder';
import { MatSelectModule } from "@angular/material/select";
import { SnackBarService } from '@services/SnackBarService';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatInput } from "@angular/material/input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import {MatListModule} from '@angular/material/list';
import { Panier } from '@models/Panier';
import { ETypeObjetProposer } from '@enums/ETypeObjetProposer';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Stockage extends VaisseauPossederStockage
{
    idVaisseau: number,
    cacher: boolean
}

type VaisseauLeger = 
{ 
    id: number, 
    nomVaisseau: string, 
    nomVaisseauAlias: string 
}

type RepartitionValider =
{
    id: number,
    quantite: number,
    idStockage: number,
    volume: number,
    vaisseau: VaisseauLeger
}

@Component({
  selector: 'app-modal-input-quantite',
  imports: [MatListModule, MatTooltipModule, MatFormFieldModule, MatIcon, MatButtonModule, MatDialogModule, ReactiveFormsModule, MatIcon, MatSelectModule, MatInput, GridContainer, GridElement],
  templateUrl: './modal-input-quantite.html',
  styleUrl: './modal-input-quantite.scss'
})
export class ModalInputQuantite implements OnInit
{
    protected form: FormGroup;
    protected listeValider = signal<RepartitionValider[]>([]);

    protected btnLabel = signal("Ajouter au panier");
    protected listeVaisseau = signal<VaisseauLeger[]>([]);
    protected listeStockage = signal<Stockage[]>([]);
    protected idAmodifier = signal<number>(0);
    protected modalModeModifier = signal(false);

    private listeVaisseauStockage = signal<VaisseauPossederStockageCompatible[]>([])
    protected matDialogData = inject(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<ModalInputQuantite>);
    private panierServ = inject(PanierService);
    private vaisseauServ = inject(VaisseauService);
    private snackBarServ = inject(SnackBarService);

    ngOnInit(): void 
    {   
        this.form = new FormGroup({
            quantite: new FormControl<number>(this.matDialogData?.quantite ?? 1, [Validators.min(1)]),
        });

        if(this.matDialogData?.quantite)
            this.modalModeModifier.set(true);

        if(this.matDialogData?.kind == "Logistique" || this.matDialogData?.type == ETypeObjetProposer.Logistique)
        {
            this.form.addControl("idVaisseau", new FormControl<number>(null, [Validators.required]));
            this.form.addControl("idStockage", new FormControl<number>(null, [Validators.required]));

            this.form.controls["quantite"].valueChanges.subscribe((valeur) =>
            {
                if(!this.form.value.idVaisseau || valeur < 0)
                    return;

                const ID_VAISSEAU = this.form.value.idVaisseau;
                this.ListerStockage(ID_VAISSEAU, valeur);
            });

            this.ListerStockageCompatible();
        }
        
        if(this.matDialogData?.quantite)
            this.btnLabel.set("Modifier la quantité");
    }

    protected AjouterRepartition(): void
    {   
        if(this.form.invalid)
            return;

        if(this.matDialogData.kind == "Materiel" || this.matDialogData?.type == ETypeObjetProposer.Materiel)
        {
            this.listeValider.set([{
                id: this.modalModeModifier() ? this.matDialogData.id : Math.floor(Math.random() * 10_000) + 1,
                quantite: this.form.value.quantite,
                idStockage: null,
                volume : 0,
                vaisseau: null
            }]);

            this.idAmodifier.set(0);
            return;
        }
        
        let ajouter = false;

        const VOLUME = this.form.value.quantite * this.matDialogData.tailleUnitaireInventaire;
        const ID_VAISSEAU = this.form.value.idVaisseau;
        const ID_STOCKAGE = this.form.value.idStockage;

        if(this.idAmodifier() > 0)
        {
            this.SupprimerRepartition(this.idAmodifier());
            this.idAmodifier.set(0);
        }

        this.listeVaisseauStockage.update(x =>
        {
            const LISTE_STOCKAGE = x.find(y => y.id == ID_VAISSEAU).listeStockage;
            let stockage = LISTE_STOCKAGE.find(y => y.id == ID_STOCKAGE);

            if(stockage.disponible == 0)
            {
                this.snackBarServ.Erreur("Stockage plein");
                return x;
            }

            if(stockage.disponible - VOLUME < 0)
            {
                this.snackBarServ.Erreur("Le volume est plus gros que la place disponible");
                return x;
            }

            ajouter = true;

            stockage.disponible -= VOLUME;
            stockage.occuper += VOLUME;

            return x;
        });

        this.listeStockage.update(x => 
        {
            let stockage = x.find(y => y.idVaisseau == ID_VAISSEAU && y.id == ID_STOCKAGE);

            if(stockage.disponible == 0 || stockage.disponible - VOLUME < 0)
                return x;

            ajouter = true;

            stockage.disponible -= VOLUME;
            stockage.occuper += VOLUME;

            stockage.cacher = stockage.disponible <= 0;
            
            return x;
        });

        if(ajouter)
        {
            this.listeValider.update(x => 
            {
                const OBJET = x.find(y => y.idStockage == ID_STOCKAGE && y.vaisseau.id == ID_VAISSEAU);

                if(OBJET)
                {
                    OBJET.quantite += this.form.value.quantite;
                    OBJET.volume += VOLUME;
                }
                else
                {
                    x.push({
                        id: this.modalModeModifier() ? this.matDialogData.id : Math.floor(Math.random() * 10_000) + 1,
                        quantite: this.form.value.quantite,
                        idStockage: ID_STOCKAGE,
                        volume : VOLUME,
                        vaisseau: this.listeVaisseau().find(x => x.id == ID_VAISSEAU),
                    });
                }

                return x;
            });
        }
    }

    protected ModifierRepartition(_element: RepartitionValider): void
    {
        const STOCKAGE = this.listeStockage().find(x => x.id == _element.idStockage);
        STOCKAGE.cacher = false;

        this.form.controls["idVaisseau"].setValue(_element.vaisseau.id);
        this.form.controls["idStockage"].setValue(STOCKAGE.id);
        this.form.controls["quantite"].setValue(_element.quantite);

        this.idAmodifier.set(_element.id);
    }

    protected SupprimerRepartition(_idRepartition: number): void
    {
        if(this.listeValider().length == 0)
            return;

        let element = {...this.listeValider().find(x => x.id == _idRepartition) };

        this.listeValider.update(x => x.filter(y => y.id != _idRepartition));

        this.listeVaisseauStockage.update(x =>
        {
            const LISTE_STOCKAGE = x.find(y => y.id == element.vaisseau.id).listeStockage;
            let stockage = LISTE_STOCKAGE.find(y => y.id == element.idStockage);

            stockage.disponible += element.volume;
            stockage.occuper -= element.volume;

            return x;
        });

        this.listeStockage.update(x => 
        {
            let stockage = x.find(y => y.idVaisseau == element.vaisseau.id && y.id == element.idStockage);
            stockage.disponible += element.volume;
            stockage.occuper -= element.volume;

            stockage.cacher = stockage.disponible <= 0;
            
            return x;
        });
    }

    protected ListerStockage(_idVaisseau: number, _quantite: number = null): void
    {
        const VOLUME = _quantite ?? this.form.value.quantite * this.matDialogData.tailleUnitaireInventaire;
        const LISTE_STOCKAGE = this.listeVaisseauStockage().find(x => x.id == _idVaisseau).listeStockage.map(x => ({
            ...x, idVaisseau: _idVaisseau,
            cacher: x.disponible < VOLUME 
        }));

        this.listeStockage.set(LISTE_STOCKAGE);
    }

    protected Valider(): void
    {
        if (this.modalModeModifier() || this.matDialogData?.kind == "Materiel")
            this.AjouterRepartition();

        if(this.listeValider().length == 0)
            return;
        
        const TYPE = this.matDialogData?.kind == "Logistique" || this.matDialogData?.type == 1 ? ETypeObjetProposer.Logistique : ETypeObjetProposer.Materiel;

        let listePanier: Panier[] = this.listeValider().map(x =>
        {
            const VAISSEAU = this.listeVaisseau().find(y => y.id == x.vaisseau.id);

            if(this.modalModeModifier())
            {
                return {
                    id: x.id,
                    nom: this.matDialogData.nom,
                    quantite: x.quantite,
                    volume: x.volume,
                    idTypeStockage: this.matDialogData?.idTypeStockage,
                    prixUnitaire: this.matDialogData.prixUnitaire,
                    idStockage: x.idStockage,
                    tailleUnitaireInventaire: this.matDialogData.tailleUnitaireInventaire,
                    vaisseau: TYPE == ETypeObjetProposer.Logistique ? {
                        id: x.vaisseau.id,  
                        nom: VAISSEAU.nomVaisseauAlias ?? VAISSEAU.nomVaisseau
                    } : null,
                    type: TYPE,
                    idType: this.matDialogData.idType
                }
            }
            else
            {
                return {
                    id: x.id,
                    nom: this.matDialogData.nom,
                    quantite: x.quantite,
                    volume: x.volume,
                    idTypeStockage: this.matDialogData?.typeStockage?.id ?? null,
                    prixUnitaire: this.matDialogData.prix,
                    idStockage: x.idStockage,
                    tailleUnitaireInventaire: this.matDialogData.tailleUnitaireInventaire,
                    vaisseau: TYPE == ETypeObjetProposer.Logistique ? {
                        id: x.vaisseau.id,  
                        nom: VAISSEAU.nomVaisseauAlias ?? VAISSEAU.nomVaisseau
                    } : null,
                    type: TYPE,
                    idType: this.matDialogData.id
                }
            }
        });

        console.log(listePanier);
        

        if(this.matDialogData?.quantite)
            this.panierServ.Modifier(listePanier[0]);

        else
            this.panierServ.Ajouter(listePanier);

        this.dialogRef.close();
    }

    private ListerStockageCompatible(): void
    {
        this.vaisseauServ.ListerStockageCompatible(this.matDialogData?.typeStockage?.id ?? this.matDialogData.idTypeStockage).subscribe({
            next: (retour) =>
            {
                if(retour.length == 0)
                {
                    this.snackBarServ.Erreur("Aucun vaisseau disponible");
                    return;
                }

                if(retour.every(x => x.listeStockage.length == 0))
                {
                    this.snackBarServ.Erreur("Aucun stockage disponible");
                    return;
                }

                const LISTE_VAISSEAU = retour.map(x => ({ id: x.id, nomVaisseau: x.nomVaisseau, nomVaisseauAlias: x.nomVaisseauAlias }));
                this.listeVaisseau.set(LISTE_VAISSEAU);

                this.listeVaisseauStockage.set(retour);

                this.form.controls["idVaisseau"].setValue(LISTE_VAISSEAU[0].id);
                this.ListerStockage(LISTE_VAISSEAU[0].id, this.form.value.quantite);

                if(this.matDialogData?.idTypeStockage)
                {
                    let info: RepartitionValider = {
                        volume: this.matDialogData.volume,
                        vaisseau: LISTE_VAISSEAU.find(x => x.id == this.matDialogData.vaisseau.id),
                        quantite: this.matDialogData.quantite,
                        idStockage: this.matDialogData.idStockage,
                        id: this.matDialogData.id
                    }
                    
                    this.ModifierRepartition(info);
                }
            }
        });
    }
}
