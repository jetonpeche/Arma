import { Component, inject, input, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SnackBarService } from '@services/SnackBarService';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { Boutique, BoutiquePersonnageAcheterRequete } from '@models/Boutique';
import { BoutiqueService } from '@services/BoutiqueService';

@Component({
  selector: 'app-boutique',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, GridContainer, ButtonLoader, GridElement],
  templateUrl: './boutique.html',
  styleUrl: './boutique.scss',
})
export class BoutiquePage implements OnInit
{
    /** Permet d'avoir la liste des objets achetés du personnage */
    idPersonnage = input<number>(0);
    protected listeBoutique = signal<Boutique[]>([]);

    private boutiqueServ = inject(BoutiqueService);
    private snackBarServ = inject(SnackBarService);
    private dialogConfimationServ = inject(DialogConfirmationService);

    ngOnInit(): void 
    {
        this.Lister();  
    }

    protected OuvrirModalConfirmationPayer(_boutique: Boutique): void
    {
        const TITRE = `Acheter ${_boutique.nom}`;
        const MESSAGE = `Confirmez-vous l'achat de ${_boutique.nom} pour ${_boutique.prix} point(s) ?`;

        this.dialogConfimationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Acheter(_boutique.id, _boutique.idPrix);
            }
        });
    }

    protected Rechercher(_recherche: string): Boutique[]
    {
        const VALEUR = _recherche.toLowerCase();
        return this.listeBoutique().filter(x => x.nom.toLowerCase().includes(VALEUR));
    }

    private Acheter(_idBoutique: number, _idBoutiquePrix: number): void
    {
        const INFO: BoutiquePersonnageAcheterRequete = {
            idBoutique: _idBoutique,
            idBoutiquePrix: _idBoutiquePrix
        };

        this.boutiqueServ.Acheter(INFO).subscribe({
            next: () =>
            {
                this.snackBarServ.Ok("L'objet a été acheté");
                this.Lister();
            }
        });
    }

    private Lister(): void
    {
        let idPersonnage = this.idPersonnage() == 0 ? 1 : this.idPersonnage();

        this.boutiqueServ.Lister(idPersonnage, this.idPersonnage() != 0 ? true : false).subscribe({
            next: (retour) => this.listeBoutique.set(retour)
        });
    }
}
