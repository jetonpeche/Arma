import { Component, inject, input, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { Boutique, BoutiquePersonnageAcheterRequete } from '@models/Boutique';
import { BoutiqueService } from '@services/BoutiqueService';
import { environment } from '../../../environements/environement';
import { Droit } from '@models/DroitGroupe';
import { EUrl } from '@enums/EUrl';
import { AuthentificationService } from '@services/AuthentificationService';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { ModalDon } from './modal-don/modal-don';
import { EModeBanque } from '@enums/EModeBanque';

@Component({
  selector: 'app-boutique',
  imports: [MatCardModule, MatDividerModule, MatIconModule, MatTooltipModule, MatFormFieldModule, MatInputModule, MatButtonModule, GridContainer, ButtonLoader, GridElement],
  templateUrl: './boutique.html',
  styleUrl: './boutique.scss',
})
export class BoutiquePage implements OnInit
{
    /** Permet d'avoir la liste des objets achetés du personnage */
    idPersonnage = input<number>(0);

    protected pointPersonnage = signal<number>(environment.utilisateur.nbPointBoutique);
    protected listeBoutique = signal<Boutique[]>([]);
    protected droit: Droit;

    protected transactionEnCours = signal<boolean>(false);
    protected transactionSucces = signal<boolean>(false);
    protected transactionEchec = signal<boolean>(false);

    // --- VARIABLES POUR L'ANIMATION DU DON ---
    protected animationDonEnCours = signal<boolean>(false);
    protected phaseDon = signal<number>(1); 
    protected montantDonActuel = signal<number>(0);

    private readonly estMobile = window.innerWidth <= 800;
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private boutiqueServ = inject(BoutiqueService);
    private authServ = inject(AuthentificationService);
    private dialogConfimationServ = inject(DialogConfirmationService);

    ngOnInit(): void
    {
        this.droit = this.authServ.RecupererDroit(EUrl.Boutique);
        this.Lister();  
    }

    protected GestionBoutique(): void
    {
        this.router.navigateByUrl("/gestion-boutique");
    }

    protected OuvrirModalDon(): void
    {
        const DIALOG_REF = this.dialog.open(ModalDon, {
            width: this.estMobile ? "95%" : "30%",
            maxWidth: "100vw"
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (montant) =>
            {
                if(montant && montant > 0)
                    this.ExecuterTransfertDon(montant);
            }
        });
    }

    protected OuvrirModalConfirmationPayer(_boutique: Boutique): void
    {
        const TITRE = `Acheter ${_boutique.nom}`;
        const MESSAGE = `Confirmez-vous l'achat de ${_boutique.nom} pour ${_boutique.prix} point(s) ?`;

        this.dialogConfimationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Acheter(_boutique.id, _boutique.idPrix, _boutique.prix);
            }
        });
    }

    protected Rechercher(_recherche: string): Boutique[]
    {
        const VALEUR = _recherche.toLowerCase();
        return this.listeBoutique().filter(x => x.nom.toLowerCase().includes(VALEUR));
    }

    private ExecuterTransfertDon(_montant: number): void
    {
        this.animationDonEnCours.set(true);

        this.pointPersonnage.update(x => x - _montant);
        environment.utilisateur.nbPointBoutique -= _montant;
        sessionStorage.setItem("utilisateur", JSON.stringify(environment.utilisateur));
        this.authServ.ModifierPointBanque(_montant, EModeBanque.Ajouter);
        this.montantDonActuel.set(_montant / 50);

        this.phaseDon.set(1);

        if ('vibrate' in navigator)
            navigator.vibrate([50, 150, 50, 150, 50]); 

        setTimeout(() => {
            this.phaseDon.set(2);

            if ('vibrate' in navigator)
                navigator.vibrate([1500, 200, 1000]); 

        }, 2000);

        setTimeout(() => {
            this.phaseDon.set(3);

            if ('vibrate' in navigator)
                navigator.vibrate([100, 50, 100]); 

        }, 5000);

        setTimeout(() => {
            this.animationDonEnCours.set(false);
        }, 8500);
    }

    private Acheter(_idBoutique: number, _idBoutiquePrix: number, _prix: number): void
    {
        const INFO: BoutiquePersonnageAcheterRequete = {
            idBoutique: _idBoutique,
            idBoutiquePrix: _idBoutiquePrix
        };

        this.transactionEnCours.set(true);
        this.transactionSucces.set(false);
        this.transactionEchec.set(false);

        setTimeout(() => 
        {
            this.boutiqueServ.Acheter(INFO).subscribe({
                next: () =>
                {
                    this.transactionEnCours.set(false);
                    this.transactionSucces.set(true);

                    this.pointPersonnage.update(x => x - _prix);
                    environment.utilisateur.nbPointBoutique -= _prix;
                    sessionStorage.setItem("utilisateur", JSON.stringify(environment.utilisateur));
                    
                    setTimeout(() => {
                        this.transactionSucces.set(false);
                        this.Lister();
                    }, 3500);
                },
                error: () => 
                {
                    this.transactionEnCours.set(false);
                    this.transactionEchec.set(true);

                    setTimeout(() => {
                        this.transactionEchec.set(false);
                    }, 4000);
                }
            });
        }, 3000);
    }

    private Lister(): void
    {
        this.boutiqueServ.Lister(this.idPersonnage(), this.idPersonnage() != 0 ? true : false).subscribe({
            next: (retour) => this.listeBoutique.set(retour)
        });
    }
}
