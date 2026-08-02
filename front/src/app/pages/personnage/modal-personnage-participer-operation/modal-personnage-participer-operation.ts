import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { MatListModule } from '@angular/material/list';
import { Personnage } from '@models/Personnage';
import { Grade } from '@models/Grade';
import { GradeService } from '@services/GradeService';
import { SnackBarService } from '@services/SnackBarService';
import { PersonnageService } from '@services/PersonnageService';
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms'; 
import { LogService } from '@services/LogService';
import { HistoriqueRapportCampagne } from '@models/HistoriqueRapportCampagne';
import { MaterielService } from '@services/MaterielService';
import { VaisseauService } from '@services/VaisseauService';
import { Materiel } from '@models/Materiel';
import { VaisseauPossederContenuStockage2 } from '@models/VaisseauPosseder';
import { MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { LogistiqueService } from '@services/LogistiqueService';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-modal-personnage-participer-operation',
  imports: [
      MatIconModule, MatDialogModule, ButtonLoader, MatListModule, 
      MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule,
      MatStepperModule, MatAutocompleteModule, MatButtonToggleModule, MatButtonModule
  ],
  templateUrl: './modal-personnage-participer-operation.html',
  styleUrl: './modal-personnage-participer-operation.scss',
})
export class ModalPersonnageParticiperOperation implements OnInit
{
    // --- ÉTAPE 1 : PERSONNEL ---
    protected listeGrade = signal<Grade[]>([]);
    protected liste = signal<{ id: number, nom: string, nomGrade: string, nbPoint: number, estBloquer: boolean }[]>([]);
    protected texteRecherche = signal<string>('');
    protected operateursSelectionnes: number[] = []; 
    protected historique = signal<HistoriqueRapportCampagne | null>(null);

    protected listeFiltree = computed(() => 
    {
        const recherche = this.texteRecherche().toLowerCase().trim();

        if (!recherche) 
            return this.liste();

        return this.liste().filter(p => p.nom.toLowerCase().includes(recherche));
    });

    // --- ÉTAPE 2 : MATÉRIEL ---
    protected listeMateriel = signal<Materiel[]>([]);
    protected materielControl = new FormControl('');
    protected materielSelectionne = signal<{materiel: Materiel, quantite: number}[]>([]);

    protected materielFiltre = computed(() => 
    {
        const search = (typeof this.materielControl.value === 'string' ? this.materielControl.value : '').toLowerCase();
        const selectedIds = this.materielSelectionne().map(m => m.materiel.id);

        return this.listeMateriel().filter(m => !selectedIds.includes(m.id) && m.nom.toLowerCase().includes(search));
    });

    // --- ÉTAPE 3 : LOGISTIQUE ---
    private listeContenuStockageVaisseauPosseder = signal<VaisseauPossederContenuStockage2[]>([]);
    protected logistiqueControl = new FormControl('');
    protected modeGroupement = signal<'vaisseau' | 'logistique'>('vaisseau');
    protected logistiqueSelectionne = signal<{logistique: VaisseauPossederContenuStockage2, quantite: number}[]>([]);

    protected logistiqueFiltreGroupe = computed(() => 
    {
        const thermeRecherche = (typeof this.logistiqueControl.value === 'string' ? this.logistiqueControl.value : '').toLowerCase();
        const selectedIds = this.logistiqueSelectionne().map(l => l.logistique.idStockageVaisseauPosseder);
        
        const dispo = this.listeContenuStockageVaisseauPosseder().filter(x =>
            !selectedIds.includes(x.idStockageVaisseauPosseder) &&
            (x.nomLogistique.toLowerCase().includes(thermeRecherche) || x.nomVaisseau.toLowerCase().includes(thermeRecherche))
        );

        const groupe = new Map<string, VaisseauPossederContenuStockage2[]>();

        for (const element of dispo) 
        {
            const cle = this.modeGroupement() === 'vaisseau' ? element.nomVaisseau : element.nomLogistique;

            if(!groupe.has(cle)) 
                groupe.set(cle, []);

            groupe.get(cle)!.push(element);
        }

        return Array.from(groupe.entries())
            .map(([cle, value]) => ({ groupName: cle, items: value }))
            .sort((a, b) => a.groupName.localeCompare(b.groupName));
    });

    protected btnClick = signal(false);

    private listePersonnage = inject<Personnage[]>(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<ModalPersonnageParticiperOperation>);
    private gradeServ = inject(GradeService);
    private materielServ = inject(MaterielService);
    private logistiqueServ = inject(LogistiqueService);
    private vaisseauServ = inject(VaisseauService);
    private personnageServ = inject(PersonnageService);
    private logServ = inject(LogService);
    private snackBarServ  = inject(SnackBarService);

    ngOnInit(): void
    {
        this.ListerGrade();
        this.ListerStockageVaisseauPosseder();
        this.ListerMaterielDisponible();
        this.RecupererDerniereEntrer();
    }

    // --- MÉTHODES ÉTAPE 1 ---
    protected ChangerRecherche(event: any): void 
    { 
        this.texteRecherche.set(event.target.value); 
    }

    protected GererSelection(event: any): void 
    {
        for (let option of event.options) 
        {
            const ID = option.value;

            if (option.selected && !this.operateursSelectionnes.includes(ID)) 
                this.operateursSelectionnes.push(ID);

            else if (!option.selected) 
                this.operateursSelectionnes = this.operateursSelectionnes.filter(x => x != ID);
        }
    }

    // --- MÉTHODES ÉTAPE 2 ---
    protected AjouterMateriel(mat: Materiel): void 
    {
        this.materielSelectionne.update(list => [...list, { materiel: mat, quantite: 1 }]);
        this.materielControl.setValue('');
    }

    protected SupprimerMateriel(id: number): void 
    {
        this.materielSelectionne.update(list => list.filter(m => m.materiel.id !== id));
    }

    protected AjusterQuantiteMateriel(item: {materiel: Materiel, quantite: number}): void 
    {
        const MAX_DISPO = item.materiel.stock + item.materiel.nbPlacer;
        
        if (item.quantite > MAX_DISPO) 
        {
            item.quantite = MAX_DISPO;
            this.snackBarServ.Erreur(`Inventaire insuffisant. Quantité ajustée au maximum (${MAX_DISPO}).`);
        } 
        else if (item.quantite < 1 || item.quantite === null) 
            item.quantite = 1;
    }

    // --- MÉTHODES ÉTAPE 3 ---
    protected ChangerModeGroupement(mode: 'vaisseau' | 'logistique'): void 
    {
        this.modeGroupement.set(mode);
    }

    protected AjouterLogistique(log: VaisseauPossederContenuStockage2): void 
    {
        this.logistiqueSelectionne.update(list => [...list, { logistique: log, quantite: 1 }]);
        this.logistiqueControl.setValue('');
    }

    protected SupprimerLogistique(id: number): void 
    {
        this.logistiqueSelectionne.update(list => list.filter(l => l.logistique.idStockageVaisseauPosseder !== id));
    }

    protected AjusterQuantiteLogistique(item: {logistique: VaisseauPossederContenuStockage2, quantite: number}): void {
        const MAX_DISPO = item.logistique.quantite;
        
        if (item.quantite > MAX_DISPO) 
        {
            item.quantite = MAX_DISPO;
            this.snackBarServ.Erreur(`Stock insuffisant. Quantité ajustée au maximum (${MAX_DISPO}).`);
        }
        else if (item.quantite < 1 || item.quantite === null)
            item.quantite = 1;
    }

    protected Valider(): void
    {
        if(!this.operateursSelectionnes || this.operateursSelectionnes.length === 0)
        {
            this.snackBarServ.Erreur("Opération annulée : Aucun opérateur sélectionné pour le rapport.");
            return;
        }

        for (const item of this.materielSelectionne())
        {
            const MAX_DISPO = item.materiel.stock + item.materiel.nbPlacer;
            if (item.quantite == null || item.quantite < 1 || item.quantite > MAX_DISPO) 
            {
                this.snackBarServ.Erreur(`Alerte Logistique : Quantité invalide détectée sur [${item.materiel.nom}].`);
                return;
            }
        }

        for (const item of this.logistiqueSelectionne()) 
        {
            const MAX_DISPO = item.logistique.quantite;
            if (item.quantite == null || item.quantite < 1 || item.quantite > MAX_DISPO) 
            {
                this.snackBarServ.Erreur(`Alerte Logistique : Quantité invalide détectée sur [${item.logistique.nomLogistique}].`);
                return;
            }
        }

        this.btnClick.set(true);

        // Préparation du convoi de requêtes
        const requetesApi: Observable<any>[] = [];

        requetesApi.push(this.personnageServ.ModifierPoint(this.operateursSelectionnes));

        if(this.materielSelectionne().length > 0)
        {
            const INFO_MAT = this.materielSelectionne().map(x => ({ id: x.materiel.id, quantiteDetruite: x.quantite }));
            requetesApi.push(this.materielServ.ModifierStock(INFO_MAT));
        }

        if(this.logistiqueSelectionne().length > 0)
        {
            const INFO_LOG = this.logistiqueSelectionne().map(x => ({ idStockageVaisseauPosseder: x.logistique.idStockageVaisseauPosseder, quantiteDetruite: x.quantite }));
            requetesApi.push(this.logistiqueServ.ModifierStock(INFO_LOG));
        }

        // Exécution simultanée de toutes les requetes
        forkJoin(requetesApi).subscribe({
            next: () =>
            {
                // Exécute lorsque TOUTES les requêtes ont réussi
                this.btnClick.set(false);
                this.snackBarServ.Ok("Déploiement enregistré, manifeste validé.");
                this.dialogRef.close(true);
            },
            error: () => this.btnClick.set(false)
        });
    }

    private RecupererDerniereEntrer(): void 
    { 
        this.logServ.RecupererDerniereEntrerPersonnageParticiperOperation().subscribe({ 
            next: (retour) => this.historique.set(retour) 
        }); 
    }

    private ListerMaterielDisponible(): void 
    { 
        this.materielServ.Lister().subscribe({ 
            next: (retour) => this.listeMateriel.set(retour.filter(x => x.stock > 0 || x.nbPlacer > 0)) 
        }); 
    }

    private ListerStockageVaisseauPosseder(): void 
    { 
        this.vaisseauServ.ListerStockagePosseder().subscribe({ 
            next: (retour) => this.listeContenuStockageVaisseauPosseder.set(retour) 
        });
    }

    private ListerGrade(): void
    {
        this.gradeServ.Lister().subscribe({
            next: (retour) => 
            {
                this.listeGrade.set(retour);
                const GRADE_MAP = new Map(retour.map(x => [x.id, x.nbPointBoutiqueGagnerParOperation]));
                this.liste.set(this.listePersonnage.map(x => ({
                        id: x.id, 
                        nom: x.nom, 
                        estBloquer: x.nbOperationGradeBloquer > 0,
                        nomGrade: x.grade?.nomRaccourci ?? "XXX", 
                        nbPoint: GRADE_MAP.get(x.grade?.id) ?? 1
                    })
                ));
            }
        });
    }
}