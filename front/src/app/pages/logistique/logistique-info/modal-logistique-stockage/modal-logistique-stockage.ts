import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { Logistique } from '@models/Logistique';

// NOUVEAU : Interface pour typer l'arbre de localisation
interface NoeudLocalisation 
{
    nom: string;
    enfants?: NoeudLocalisation[];
    niveau?: number;
}

@Component({
  selector: 'app-modal-logistique-stockage',
  imports: [MatIconModule, MatTreeModule, MatDialogModule, MatButtonModule],
  templateUrl: './modal-logistique-stockage.html',
  styleUrl: './modal-logistique-stockage.scss',
})
export class ModalLogistiqueStockage implements OnInit
{    
    protected dialogData: Logistique = inject(MAT_DIALOG_DATA);
    protected dataSource = new MatTreeNestedDataSource<NoeudLocalisation>();

    protected hasChild = (_: number, node: NoeudLocalisation) => !!node.enfants && node.enfants.length > 0;
    protected childrenAccessor = (node: NoeudLocalisation) => node.enfants ?? [];

    ngOnInit(): void 
    {
        const regroupement: Record<string, NoeudLocalisation[]> = {};

        // 1. On trie les localisations par Vaisseau
        for (const element of this.dialogData.listeStockageVaisseau) 
        {
            const nomVaisseau = element.nomVaisseau;

            if (!regroupement[nomVaisseau]) {
                regroupement[nomVaisseau] = [];
            }

            // NIVEAU 1 : La Soute et la Quantité
            regroupement[nomVaisseau].push({ 
                nom: `Soute : ${element.nomStockage} (Quantité : ${element.quantite})`,
                niveau: 1
            });
        }

        // 2. NIVEAU 0 : On crée les nœuds racines (Les Vaisseaux)
        const donneesArbre: NoeudLocalisation[] = Object.entries(regroupement).map(([nomVaisseau, listeSoutes]) => 
        {
            return {
                nom: `Vaisseau : ${nomVaisseau} (${listeSoutes.length} soute(s) affectée(s))`,
                enfants: listeSoutes,
                niveau: 0
            };
        });

        this.dataSource.data = donneesArbre;
    }
}