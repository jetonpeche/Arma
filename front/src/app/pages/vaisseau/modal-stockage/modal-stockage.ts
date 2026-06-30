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

			regroupement[nomType].push({ nom: `Taille: ${element.taille}, ${element.nom}` });
		}

		const donneesArbre: NoeudStockage[] = Object.entries(regroupement).map(([nomCategorie, listeVaisseaux]) => 
		{
			return {
				nom: nomCategorie + " (" + listeVaisseaux.length + ")",
				enfants: listeVaisseaux
			};
		});

		this.dataSource.data = donneesArbre;
	}
}
