import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AjouterModifierTypeLogistique } from '@modals/ajouter-modifier-type-logistique/ajouter-modifier-type-logistique';
import { Droit } from '@models/DroitGroupe';
import { TypeLogistique } from '@models/Logistique';
import { TypeLogistiqueService } from '@services/TypeLogistiqueService';

@Component({
  selector: 'app-type-logistique',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './type-logistique.html',
  styleUrl: './type-logistique.scss',
})
export class TypeLogistiquePage implements OnInit
{
    droit = input.required<Droit>();

    // Gestion de l'état avec des signaux
    protected listeTypes = signal<TypeLogistique[]>([]);
    protected rechercheRequete = signal<string>('');
    
    protected typesFiltres = computed(() => 
    {
        const VALEUR = this.rechercheRequete();

        if (!VALEUR) 
            return this.listeTypes();
        
        return this.listeTypes().filter(x => 
            x.nom.toLowerCase().includes(VALEUR)
        );
    });

    private dialog = inject(MatDialog);
    private typeLogistiqueServ = inject(TypeLogistiqueService);

    ngOnInit(): void 
    {
        this.Lister();    
    }

    protected Recherche(_event: Event): void
    {
        const VALEUR = (_event.target as HTMLInputElement).value;
        this.rechercheRequete.set(VALEUR.trim().toLowerCase());
    }

    protected OuvrirModalAjouterModifierTypeLogistique(_typeLogistique?: TypeLogistique): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierTypeLogistique, {
            data: _typeLogistique
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
        this.typeLogistiqueServ.Lister().subscribe({
            next: (retour: TypeLogistique[]) => 
            {
                this.listeTypes.set(retour);
            }
        });
    }
}