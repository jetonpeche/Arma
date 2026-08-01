import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Aeronef, VaisseauAeronefPlaceDisponible } from '@models/Aeronef';
import { AeronefService } from '@services/AeronefService';
import { UpperCasePipe } from '@angular/common';
import { SnackBarService } from '@services/SnackBarService';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";

export type LigneAchat = 
{
    vaisseau: VaisseauAeronefPlaceDisponible;
    quantite: number;
};

@Component({
  selector: 'app-modal-acheter',
  imports: [
    MatDialogModule, MatButtonModule, FormsModule, UpperCasePipe,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatIconModule,
    ButtonLoader
],
  templateUrl: './modal-acheter.html',
  styleUrl: './modal-acheter.scss',
})
export class ModalAcheter implements OnInit
{
    protected dialogData: Aeronef = inject(MAT_DIALOG_DATA);
    
    protected listeVaisseauCompatible = signal<VaisseauAeronefPlaceDisponible[]>([]);
    protected panier = signal<LigneAchat[]>([]);
    protected btnClick = signal<boolean>(false);
    
    protected vaisseauSelectionne: VaisseauAeronefPlaceDisponible | null = null;
    protected quantiteSaisie: number = 1;

    protected totalCommande = computed(() => {
        return this.panier().reduce((acc, ligne) => acc + (ligne.quantite * this.dialogData.prix), 0);
    });

    private aeronefServ = inject(AeronefService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<ModalAcheter>);

    ngOnInit(): void 
    {
        this.ListerVaisseauCompatible();
    }

    protected AjouterAuBordereau(): void
    {
        if (!this.vaisseauSelectionne || this.quantiteSaisie <= 0) 
            return;

        const placesDispo = this.vaisseauSelectionne.nombrePlace;
        
        this.panier.update(lignes => {
            const INDEX = lignes.findIndex(x => x.vaisseau.id == this.vaisseauSelectionne!.id);
            
            if (INDEX != -1) 
            {
                const nouvelleQuantite = lignes[INDEX].quantite + this.quantiteSaisie;
                lignes[INDEX].quantite = Math.min(nouvelleQuantite, placesDispo);
            } 
            else 
            {
                lignes.push({
                    vaisseau: this.vaisseauSelectionne!,
                    quantite: Math.min(this.quantiteSaisie, placesDispo)
                });
            }

            return [...lignes];
        });

        this.vaisseauSelectionne = null;
        this.quantiteSaisie = 1;
    }

    protected SupprimerDuBordereau(index: number): void
    {
        this.panier.update(lignes => lignes.filter((_, i) => i !== index));
    }

    protected ControlerModificationQuantite(ligne: LigneAchat): void
    {
        const maxPlace = Number(ligne.vaisseau.nombrePlace);
        if (ligne.quantite > maxPlace) ligne.quantite = maxPlace;
        if (ligne.quantite < 1) ligne.quantite = 1;
        
        this.panier.update(lignes => [...lignes]); 
    }

    protected ValiderCommande(): void
    {

        if (this.panier().length === 0)
        {
            this.snackBarServ.Erreur("Le bordereau d'ordre est vide. Ajout annulé.");
            return;
        }

        for (const ligne of this.panier()) 
        {
            const maxPlace = Number(ligne.vaisseau.nombrePlace);
            
            if (ligne.quantite < 1) 
            {
                this.snackBarServ.Erreur(`Télémétrie invalide : Quantité incorrecte pour le ${ligne.vaisseau.nomVaisseau}.`);
                return;
            }

            if (ligne.quantite > maxPlace) 
            {
                this.snackBarServ.Erreur(`Alerte Logistique : La commande excède la capacité du hangar du ${ligne.vaisseau.nomVaisseau} (Max: ${maxPlace}).`);
                return;
            }
        }

        const INFO = this.panier().map(x => ({ idVaisseauPosseder: x.vaisseau.id, quantite: x.quantite }));
        
        this.btnClick.set(true);

        this.aeronefServ.Acheter(this.dialogData.id, INFO).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
            }, error: () => this.btnClick.set(false)
        });
    }

    private ListerVaisseauCompatible(): void
    {
        this.aeronefServ.ListerVaisseauCompatiblePlaceDisponible(this.dialogData.id).subscribe({
            next: (retour) => this.listeVaisseauCompatible.set(retour)
        });
    }
}