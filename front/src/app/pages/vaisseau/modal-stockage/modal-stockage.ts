import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Vaisseau } from '@models/Vaisseau';
import {MatTreeModule, MatTreeNestedDataSource} from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';

interface NoeudStockage 
{
  nom: string;
  enfants?: NoeudStockage[];
  estContenu?: boolean;
  niveau?: number;
}

@Component({
  selector: 'app-modal-stockage',
  imports: [MatIconModule, MatTreeModule, MatDialogModule, MatButtonModule],
  templateUrl: './modal-stockage.html',
  styleUrl: './modal-stockage.scss',
})
export class ModalStockage implements OnInit
{
    protected dialogData: Vaisseau = inject(MAT_DIALOG_DATA);
	protected dataSource = new MatTreeNestedDataSource<NoeudStockage>();

	protected hasChild = (_: number, node: NoeudStockage) => !!node.enfants && node.enfants.length > 0;
	protected childrenAccessor = (node: NoeudStockage) => node.enfants ?? [];

	ngOnInit(): void 
    {
        const regroupement: Record<string, NoeudStockage[]> = {};

        for (const element of this.dialogData.listeStockage) 
        {
            const nomType = element.typeStockage.nom;

            if (!regroupement[nomType])
                regroupement[nomType] = [];

            // 1. Soute (NIVEAU 1)
            const noeudSoute: NoeudStockage = { 
                nom: `Soute : ${element.nom} (Volume : ${element.taille})`,
                niveau: 1 
            };

            // 2. Contenu (NIVEAU 2)
            if (element.contenuParDefaut && element.contenuParDefaut.length > 0) 
            {
                noeudSoute.enfants = element.contenuParDefaut.map(contenu => ({
                    nom: `${contenu.quantite}x ${contenu.nom}`,
                    estContenu: true,
                    niveau: 2
                }));
            }

            regroupement[nomType].push(noeudSoute);
        }

        // 3. Catégorie Racine (NIVEAU 0)
        const donneesArbre: NoeudStockage[] = Object.entries(regroupement).map(([nomCategorie, listeVaisseaux]) => 
        {
            return {
                nom: `${nomCategorie} (${listeVaisseaux.length})`,
                enfants: listeVaisseaux,
                niveau: 0
            };
        });

        this.dataSource.data = donneesArbre;
    }
}
