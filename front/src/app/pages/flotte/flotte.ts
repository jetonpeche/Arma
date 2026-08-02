import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ModalExplicationVaisseau } from '@modals/modal-explication-vaisseau/modal-explication-vaisseau';
import { DialogConfirmationService } from '@services/DialogConfirmationService';

@Component({
  selector: 'app-flotte',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatTabsModule, MatDividerModule, MatProgressBarModule, MatIconModule],
  templateUrl: './flotte.html',
  styleUrl: './flotte.scss',
})
export class Flotte implements OnInit
{
    protected vaisseauHeroique = signal<VaisseauPosseder | null>(null);
    protected phaseDestruction = signal<'INACTIF' | 'TERMINAL' | 'MIA'>('INACTIF');
    protected texteTerminal = signal<string>('');

    protected listeVaisseau = signal<VaisseauPosseder[]>([]);
    protected rechercheAlias = signal<string>('');

    protected listeVaisseauFiltree = computed(() => 
    {
        const terme = this.rechercheAlias().toLowerCase().trim();
        const liste = this.listeVaisseau();
        
        if (!terme)
            return liste;
        
        return liste.filter(v => 
            v.nomVaisseauAlias?.toLowerCase().includes(terme)
        );
    });

    private vaisseauServ = inject(VaisseauService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private dialog = inject(MatDialog);
    private readonly estMobile = window.innerWidth <= 800;
    private phrasesDernierMessage = [
        "A tout l'équipage ! Évacuer le vaisseau ! évacuer le vaisseau !",
        "Dernière transmission : On les emmène avec nous, bonne chance à vous !",
        "Surcharge du réacteur principal ! Rupture imminente !",
        "Liaison perdue. Systèmes de survie hors-ligne. Que Dieu nous aide !",
        "Alerte : Brèche massive dans la coque. Évacuation impossible..."
    ];

    ngOnInit(): void 
    {
        this.Lister();
    }

    protected OuvrirModalInformation(): void
    {
        this.dialog.open(ModalExplicationVaisseau, {
            width: this.estMobile ? "95%" : "70%", 
            maxWidth: "100vw"
        });
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

    protected OuvrirModalConfirmationDetruit(_vaisseau: VaisseauPosseder): void
    {
        const MESSAGE = `Veuillez confimez la destruction du ${_vaisseau.nomVaisseauAlias} commandant !`;
        this.dialogConfirmationServ.Ouvrir("Vaisseau détruit", MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Detruit(_vaisseau);
            }
        });
    }

private Detruit(_vaisseau: VaisseauPosseder): void
    {
        this.vaisseauServ.Detruit(_vaisseau.id).subscribe({
            next: () =>
            {
                // 1. Initialise la Phase Terminal
                this.vaisseauHeroique.set(_vaisseau);
                this.phaseDestruction.set('TERMINAL');
                this.texteTerminal.set('');

                // 2. Sélectionne un dernier message au hasard
                const phrase = this.phrasesDernierMessage[Math.floor(Math.random() * this.phrasesDernierMessage.length)];
                
                // 3. Déclenche l'effet "Machine à écrire"
                let index = 0;
                const typingInterval = setInterval(() => {
                    this.texteTerminal.update(actuel => actuel + phrase.charAt(index));
                    index++;
                    
                    if (index === phrase.length) 
                    {
                        clearInterval(typingInterval);
                        
                        // 4. Attend 1.5 seconde pour laisser l'officier lire le message...
                        setTimeout(() => {
                            
                            // 5. BOUM ! Passage en phase d'hommage
                            this.phaseDestruction.set('MIA');
                            
                            // Protocole Haptique (Onde de choc sur mobile)
                            if ('vibrate' in navigator) {
                                navigator.vibrate([200, 50, 100, 50, 500]);
                            }

                        }, 1500);
                    }
                }, 50); // 50ms par lettre (rythme d'un téléscripteur militaire)
            }
        });
    }

    protected TerminerHommage(_idVaisseau: number): void
    {
        // On purge tout pour revenir à la normale
        this.vaisseauHeroique.set(null);
        this.phaseDestruction.set('INACTIF');
        this.texteTerminal.set('');
        this.listeVaisseau.update(x => x.filter(v => v.id != _idVaisseau));
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
