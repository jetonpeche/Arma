import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { Vaisseau, VaisseauAeronef, VaisseauArmement, VaisseauLeger, VaisseauStockage } from '@models/Vaisseau';
import { VaisseauService } from '@services/VaisseauService';
import { ButtonLoader, InputFile } from "@jetonpeche/angular-mat-input";
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierVaisseau } from '@modals/ajouter-modifier-vaisseau/ajouter-modifier-vaisseau';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { SnackBarService } from '@services/SnackBarService';
import { AuthentificationService } from '@services/AuthentificationService';
import { Droit } from '@models/DroitGroupe';
import { EUrl } from '@enums/EUrl';
import { environment } from '../../../environements/environement';
import { ModalInitInfo } from './modal-init-info/modal-init-info';
import { ETypeRessource } from '@enums/ETypeRessource';
import { FichierService } from '@services/FichierService';
import { DecimalPipe, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-vaisseau',
  imports: [DecimalPipe, MatIcon, UpperCasePipe, MatButtonModule, MatFormFieldModule, MatInputModule, MatSortModule, MatPaginatorModule, ButtonLoader, InputFile],
  templateUrl: './vaisseau.html',
  styleUrl: './vaisseau.scss',
})
export class VaisseauPage implements OnInit
{
    protected listeVaisseau = signal<Vaisseau[]>([]);
    protected btnClick = signal<boolean>(false);
    protected droit: Droit;
    protected peutAcheterVaisseau: boolean;

    private vaisseauServ = inject(VaisseauService);
    private snackBarServ = inject(SnackBarService);
    private fichierServ = inject(FichierService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private authServ = inject(AuthentificationService);
    private dialog = inject(MatDialog);
    private readonly estMobile = window.innerWidth <= 800;
    protected listeVaisseauClone = signal<Vaisseau[]>([]);

    ngOnInit(): void
    {
        this.ListerVaisseau();

        this.droit = this.authServ.RecupererDroit(EUrl.Vaisseau);
        this.peutAcheterVaisseau = environment.utilisateur.droit.peutAcheterVaisseau;
    }

    protected Rechercher(_valeur: string): void
    {
        const VALEUR = _valeur.toLowerCase().trim();
        this.listeVaisseau.set(this.listeVaisseauClone().filter(x => x.nom.toLowerCase().includes(VALEUR)))
    }

    protected FormaterAeronefs(_listeAeronef: VaisseauAeronef[]): string[] 
    {
        if (!_listeAeronef) return [];
        return _listeAeronef.map(x => `${x.nombre} x ${x.nom}`);
    }

    protected FormaterArmement(_listeArmement: VaisseauArmement[]): string[] 
    {
        return _listeArmement.map(x => `${x.nombre} x ${x.nom}`);
    }

    protected FormaterVaisseauxEmbarques(_listeVaisseauEnfant: VaisseauLeger[]): string[] 
    {
        return _listeVaisseauEnfant.map(x => x.nom);
    }

    protected FormaterStockage(_listeStockage: VaisseauStockage[]): string[] 
    {
        if (!_listeStockage || _listeStockage.length == 0) 
            return [];

        // Utilisation d'une Map pour regrouper par "taille-type"
        const groupes = new Map<string, { compte: number, taille: number, typeNom: string }>();

        for (const stock of _listeStockage) 
        {
            const cle = `${stock.taille}-${stock.typeStockage.nom}`;
            
            if (groupes.has(cle)) 
                groupes.get(cle)!.compte++;
            
            else 
                groupes.set(cle, { compte: 1, taille: stock.taille, typeNom: stock.typeStockage.nom });
        }

        return Array.from(groupes.values()).map(g => `${g.compte} x ${g.taille} ${g.typeNom.toUpperCase()}`);
    }

    protected UploadFichier(_idVaisseau: number, _fichier: File): void
    {
        this.fichierServ.Upload(_idVaisseau, ETypeRessource.Vaisseau, _fichier).subscribe({
            next: (url: string) => 
            {
                this.snackBarServ.Ok("Le fichier a été uploadé");
                this.listeVaisseau.update(x => 
                {
                    return x.map(y => 
                    {
                        if (y.id == _idVaisseau)
                            return { ...y, urlImageObjet: `${url}?t=${new Date().getTime()}` }
                        
                        return y;
                    });
                });
            }
        });
    }

    protected OuvrirModalConfirmationSupprimerVaisseau(_vaisseau: Vaisseau): void
    {
        const TITRE = `Supprimer un vaisseau`;
        const MESSAGE = `Confirmez-vous la suppression de ${_vaisseau.nom} ?`;

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.SupprimerVaisseau(_vaisseau.id);
            }
        });
    }

    protected OuvrirModalConfirmationAcheterVaisseau(_vaisseau: Vaisseau): void
    {
        const TITRE = `Acheter un vaisseau`;
        const MESSAGE = `Confirmez-vous l'achat de ${_vaisseau.nom} ?`;

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.AcheterVaisseau(_vaisseau.id, _vaisseau.prix);
            }
        });
    }

    protected OuvrirModalAjouterModifierVaisseau(_vaisseau?: Vaisseau): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierVaisseau, {
            width: this.estMobile ? "95%" : "70%", 
            maxWidth: "100vw",
            data: _vaisseau
        });

        DIALOG_REF.afterClosed().subscribe({
            next: () => this.ListerVaisseau()
        });
    }

    private SupprimerVaisseau(_idVaisseau: number): void
    {
        this.btnClick.set(true);

        this.vaisseauServ.Supprimer(_idVaisseau).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.snackBarServ.Ok("Le vaisseau a été supprimé");

                this.listeVaisseau.update(x => x.filter(x => x.id != _idVaisseau));
            },
            error: () => this.btnClick.set(false)
        })
    }

    private AcheterVaisseau(_idVaisseau: number, _prix: number): void
    {
        const DIALOG_REF = this.dialog.open(ModalInitInfo);

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) =>
            {
                if(!retour)
                    return;

                retour.idVaisseau = _idVaisseau;

                this.btnClick.set(true);

                this.vaisseauServ.Acheter(retour).subscribe({
                    next: () =>
                    {
                        this.btnClick.set(false);
                        this.snackBarServ.Ok("Le vaisseau a été acheté");
                        this.authServ.ModifierPointBanque(_prix);

                        this.listeVaisseau.update(x => {
                            x.find(x => x.id == _idVaisseau).stock += 1;

                            return x;
                        });
                    },
                    error: () => this.btnClick.set(false)
                });
            }
        });
    }

    private ListerVaisseau(): void
    {
        this.vaisseauServ.Lister().subscribe({
            next: (retour) =>
            {
                this.listeVaisseau.set(retour);
                this.listeVaisseauClone.set(retour);
            }
        });
    }
}
