import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { EUrl } from '@enums/EUrl';
import { Droit, DroitGroupe } from '@models/DroitGroupe';
import { AuthentificationService } from '@services/AuthentificationService';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { DroitGroupeService } from '@services/DroitGroupeService';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { SnackBarService } from '@services/SnackBarService';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierDroitGroupe } from '@modals/ajouter-modifier-droit-groupe/ajouter-modifier-droit-groupe';

@Component({
  selector: 'app-gestion-droit',
  imports: [MatListModule, MatDividerModule, MatIcon, MatButtonModule, ButtonLoader],
  templateUrl: './gestion-droit.html',
  styleUrl: './gestion-droit.scss',
})
export class GestionDroitPage implements OnInit
{
    protected droit: Droit;
    protected listeDroitGroupe = signal<DroitGroupe[]>([]);
    protected btnClick = signal<boolean>(false);

    private dialog = inject(MatDialog);
    private droitGroupeServ = inject(DroitGroupeService);
    private authServ = inject(AuthentificationService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private snackBarServ = inject(SnackBarService);

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.DroitGroupe);
        this.Lister();
    }
    
    protected OuvrirModalAjouterModifierDroitGroupe(_droitGroupe?: DroitGroupe): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierDroitGroupe, {
            width: "70%", 
            maxWidth: "100vw",
            data: _droitGroupe
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (droitGroupeRetour: DroitGroupe | null) =>
            {
                if(!droitGroupeRetour)
                    return;

                this.listeDroitGroupe.update(x => 
                {
                    if(_droitGroupe)
                    {
                        return x.map(y =>
                        {
                            if (y.id == _droitGroupe.id)
                                return droitGroupeRetour;
                            
                            return y;
                        });
                    }

                    x.push(droitGroupeRetour);
                    x.sort((a, b) => 
                    {
                        let nomA = a.nom.toLowerCase();
                        let nomB = b.nom.toLowerCase();

                        if(nomA < nomB)
                            return -1;

                        if(nomA > nomB)
                            return 1;

                        return 0;
                    });

                    return x;
                });
            }
        });
    }

    protected OurvrirModalConfirmationSupprimer(_droitGroupe: DroitGroupe): void
    {
        const TITRE = `Supprimer ${_droitGroupe.nom}`;
        const MESSAGE = `Confirmez vous la suppression de ${_droitGroupe.nom} ?`;

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(_droitGroupe.id);
            }
        });
    }

    private Supprimer(_idDroitGroupe: number): void
    {
        this.btnClick.set(true);

        this.droitGroupeServ.Supprimer(_idDroitGroupe).subscribe({
            next: () =>
            {
                this.listeDroitGroupe.update(x => x.filter(y => y.id != _idDroitGroupe));
                this.btnClick.set(false);
                this.snackBarServ.Ok("Le groupe de droit a été supprimé");
            },
            error: () => this.btnClick.set(false)
        });
    }

    private Lister(): void
    {
        this.droitGroupeServ.Lister().subscribe({
            next: (retour) =>
            {
                this.listeDroitGroupe.set(retour);
            }
        });
    }
}
