import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { VaisseauPosseder, VaisseauPossederAeronef, VaisseauPossederArmement } from '@models/VaisseauPosseder';
import { VaisseauService } from '@services/VaisseauService';
import { ModalContenuStockage } from './modal-contenu-stockage/modal-contenu-stockage';
import { ModalModifierArmement } from './modal-modifier-armement/modal-modifier-armement';
import { ModalModifierVaisseauPosseder } from './modal-modifier-vaisseau-posseder/modal-modifier-vaisseau-posseder';
import { ModalModifierAeronef } from './modal-modifier-aeronef/modal-modifier-aeronef';

@Component({
  selector: 'app-flotte',
  imports: [MatButtonModule, MatCardModule, MatTabsModule, MatDividerModule, MatProgressBarModule, MatIconModule],
  templateUrl: './flotte.html',
  styleUrl: './flotte.scss',
})
export class Flotte implements OnInit
{
    protected listeVaisseau = signal<VaisseauPosseder[]>([]);

    private vaisseauServ = inject(VaisseauService);
    private dialog = inject(MatDialog);
    private readonly estMobile = window.innerWidth <= 800;

    ngOnInit(): void 
    {
        this.Lister();
    }

    protected OuvrirModalModifier(_vaisseau: VaisseauPosseder): void
    {
        const DIALOG_REF = this.dialog.open(ModalModifierVaisseauPosseder, {
            width: this.estMobile ? "95%" : "50%", 
            maxWidth: "100vw",
            data: _vaisseau
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) =>
            {
                if(retour === true)
                    this.Lister();
            }
        });
    }

    protected OuvrirModalModifierArmement(_idVaisseauPosseder: number, _armement: VaisseauPossederArmement): void
    {
        const DIALOG_REF = this.dialog.open(ModalModifierArmement, {
            width: this.estMobile ? "95%" : "50%", 
            maxWidth: "100vw",
            data: {
                idVaisseauPosseder: _idVaisseauPosseder,
                armement: _armement
            }
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) =>
            {
                if(retour === true)
                    this.Lister();
            }
        });
    }

    protected OuvrirModalModifierAeronef(_idVaisseauPosseder: number, _aeronef: VaisseauPossederAeronef): void
    {
        const DIALOG_REF = this.dialog.open(ModalModifierAeronef, {
            width: this.estMobile ? "95%" : "50%", 
            maxWidth: "100vw",
            data: {
                idVaisseauPosseder: _idVaisseauPosseder,
                aeronef: _aeronef
            }
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) =>
            {   
                if(retour === true)
                    this.Lister();
            }
        });
    }

    protected OuvrirModalContenuStockage(_idVaisseau: number, _idStockage): void
    {
        this.vaisseauServ.ListerContenuStockage(_idVaisseau, _idStockage).subscribe({
            next: (retour) =>
            {
                this.dialog.open(ModalContenuStockage, {
                    width: this.estMobile ? "95%" : "40%", 
                    maxWidth: "100vw",
                    data: retour
                });
            }
        });
    }

    private Lister(): void
    {
        this.vaisseauServ.ListerPosseder().subscribe({
        next: (retour) =>
        {
            this.listeVaisseau.set(retour);
        }
        });
    }
}
