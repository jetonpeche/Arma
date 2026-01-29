import { Component, inject, OnInit, signal } from '@angular/core';
import { PersonnageService } from '@services/PersonnageService';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierPersonnage } from '@modals/ajouter-modifier-personnage/ajouter-modifier-personnage';
import { Personnage } from '@models/Personnage';
import { SnackBarService } from '@services/SnackBarService';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { InputFile } from "@jetonpeche/angular-mat-input";
import { FichierService } from '@services/FichierService';
import { ETypeRessource } from '@enums/ETypeRessource';
import { ModalObjetPossede } from './modal-objet-possede/modal-objet-possede';
import { Droit } from '@models/DroitGroupe';
import { AuthentificationService } from '@services/AuthentificationService';
import { EUrl } from '@enums/EUrl';

@Component({
  selector: 'app-personnage',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIcon, MatFormField, MatLabel, InputFile],
  templateUrl: './personnagePage.html',
  styleUrl: './personnagePage.scss',
})
export class PersonnagePage implements OnInit
{
    protected listePersonnage = signal<Personnage[]>([]);
    protected droit: Droit;
    protected droitFichier: Droit;

    private personnageServ = inject(PersonnageService);
    private dialog = inject(MatDialog);
    private snackBarServ = inject(SnackBarService);
    private fichierServ = inject(FichierService);
    private dialogServ = inject(DialogConfirmationService);
    private authServ = inject(AuthentificationService);

    ngOnInit(): void 
    {
        this.Lister();

        this.droit = this.authServ.RecupererDroit(EUrl.Personnage);
        this.droitFichier = this.authServ.RecupererDroit(EUrl.UploadFichier);
    }

    protected Rechercher(_recherche: string): Personnage[]
    {
        const VALEUR = _recherche.toLowerCase();
        return this.listePersonnage().filter(x => x.nom.toLowerCase().includes(VALEUR));
    }

    protected UploadFichier(_idPersonnage: number, _fichier: File): void
    {
        this.fichierServ.Upload(_idPersonnage, ETypeRessource.Personnage, _fichier).subscribe({
            next: (url: string) => 
            {
                this.snackBarServ.Ok("Le fichier a été uploadé");
                this.listePersonnage.update(x => 
                {
                    return x.map(p => 
                    {
                        // Permet de faire detecter le rafraichissement de l'image
                        if (p.id == _idPersonnage)
                            return { ...p, urlPhotoIdentite: `${url}?t=${new Date().getTime()}` }
                        
                        return p;
                    });
                });
            }
        });
    }

    protected OuvrirModalObjetBoutiquePosseder(_personnage: Personnage): void
    {
        this.dialog.open(ModalObjetPossede, { 
            width: "70%", 
            maxWidth: "100vw",
            data: _personnage.id
        });
    }

    protected OuvrirModalAjouterPersonne(_personnage?: Personnage): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierPersonnage, { 
            width: "50%", 
            maxWidth: "100vw",
            data: _personnage
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (estTrue: boolean) =>
            {
                if(estTrue)
                    this.Lister();
            }
        });
    }

    protected OuvrirModalSupprimer(_personnage: Personnage): void
    {
        const TITRE = `Supprimer ${_personnage.nom}`;
        const MESSAGE = `Confirmez-vous la suppression definitif de ${_personnage.nom}`;

        this.dialogServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(_personnage.id);
            }
        });
    }

    private Supprimer(_idPersonnage: number): void
    {
        this.personnageServ.Supprimer(_idPersonnage).subscribe({
            next: () => {
                this.Lister();
                this.snackBarServ.Ok("Le personnage a été supprimé");
            }
        });
    }

    private Lister(): void
    {
        this.personnageServ.Lister().subscribe({
            next: (x) => this.listePersonnage.set(x)
        });
    }
}
