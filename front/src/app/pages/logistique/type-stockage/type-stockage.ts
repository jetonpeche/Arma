import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TypeStockageLogistique } from '@models/Logistique';
import { TypeStockageLogistiqueService } from '@services/TypeStockageLogistiqueService';
import { AjouterModifierTypeStockageLogistique } from '@modals/ajouter-modifier-type-stockage-logistique/ajouter-modifier-type-logistique';
import { Droit } from '@models/DroitGroupe';

@Component({
  selector: 'app-type-stockage',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './type-stockage.html',
  styleUrl: './type-stockage.scss',
})
export class TypeStockagePage implements OnInit
{
    droit = input.required<Droit>();

    protected listeTypes = signal<TypeStockageLogistique[]>([]);
    protected rechercheRequete = signal<string>('');

    protected typesFiltres = computed(() => {
        const VALEUR = this.rechercheRequete();
        if (!VALEUR) return this.listeTypes();
        
        return this.listeTypes().filter(x => 
            x.nom.toLowerCase().includes(VALEUR)
        );
    });

    private dialog = inject(MatDialog);
    private typeStockageLogistiqueServ = inject(TypeStockageLogistiqueService);

    ngOnInit(): void
    {
        this.Lister();    
    }
    
    protected Recherche(_event: Event): void
    {
        const VALEUR = (_event.target as HTMLInputElement).value;
        this.rechercheRequete.set(VALEUR.trim().toLowerCase());
    }
    
    protected OuvrirModalAjouterModifierTypeStockageLogistique(_typeStockageLogistique?: TypeStockageLogistique): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierTypeStockageLogistique, {
            data: _typeStockageLogistique
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) => 
            {
                if(retour)
                    this.Lister();
            }
        });
    }
    
    private Lister(): void
    {
        this.typeStockageLogistiqueServ.Lister().subscribe({
            next: (retour: TypeStockageLogistique[]) => 
            {
                this.listeTypes.set(retour);
            }
        });
    }
}