import { Component, computed, HostListener, inject, OnInit, signal, viewChild } from '@angular/core';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { PlaneteConnecter, PlaneteOrigine } from '@models/PlaneteOrigine';
import { Systeme, SystemeConnecter } from '@models/Systeme';
import { AuthentificationService } from '@services/AuthentificationService';
import { PlaneteService } from '@services/PlaneteService';
import { SystemeService } from '@services/SystemeService';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UpperCasePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackBarService } from '@services/SnackBarService';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { EStatusPlanete } from '@enums/EStatusPlanete';
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierPlaneteOrigine } from '@modals/ajouter-modifier-planete-origine/ajouter-modifier-planete-origine';
import { AjouterModifierSysteme } from '@modals/ajouter-modifier-systeme/ajouter-modifier-systeme';

@Component({
  selector: 'app-carte-galactique',
  imports: [MatDividerModule, MatMenuModule, DragDropModule, MatTooltipModule, MatIconModule, MatButtonModule, UpperCasePipe],
  templateUrl: './carte-galactique.html',
  styleUrl: './carte-galactique.scss',
})
export class CarteGalactique implements OnInit
{
  protected listeSysteme = signal<Systeme[]>([]);
  protected listePlanete = signal<PlaneteOrigine[]>([]);
  protected listeSystemeConnexion = signal<SystemeConnecter[]>([]);
  protected listePlaneteConnexion = signal<PlaneteConnecter[]>([]);
  protected droit: Droit;

    // --- MOTEUR PAN & ZOOM ---
    protected echelle = signal<number>(1);
    protected panX = signal<number>(0);
    protected panY = signal<number>(0);
    protected isDragging = signal<boolean>(false);

    // --- MENU CONTEXTUEL ---
    protected contextMenuTrigger = viewChild.required(MatMenuTrigger);
    protected clicX = signal<number>(0);
    protected clicY = signal<number>(0);

    // Position de l'ancre invisible sur l'écran
    protected contextMenuPosition = { x: '0px', y: '0px' };

    protected modeEdition = signal<boolean>(false);
    protected systemeActif = signal<Systeme | null>(null);
    protected systemeSelectionneRoute = signal<Systeme | null>(null);
    
    private startDragX = 0;
    private startDragY = 0;
    private readonly TAILLE_CASE = 100;
    private readonly estMobile = window.innerWidth <= 800;

    private planeteServ = inject(PlaneteService);
    private systemeServ = inject(SystemeService);
    private authServ = inject(AuthentificationService);
    private snackBarServ = inject(SnackBarService);
    private dialog = inject(MatDialog);

    // Cet algorithme transforme les X/Y de la grille en pixels pour tracer les lignes SVG au centre des cases
    // --- CALCUL DES ROUTES SYSTÈMES ---
    protected routesSystemes = computed(() => {
        const systemes = this.listeSysteme();
        const connexions = this.listeSystemeConnexion();
        
        return connexions.map(conn => {
            const sysA = systemes.find(s => s.id === conn.idSystemeA);
            const sysB = systemes.find(s => s.id === conn.idSystemeB);

            if (!sysA || !sysB) return null;

            const x1 = (sysA.positionX - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const y1 = (sysA.positionY - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const x2 = (sysB.positionX - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const y2 = (sysB.positionY - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);

            return {
                x1, y1, x2, y2,
                midX: (x1 + x2) / 2, // Centre X
                midY: (y1 + y2) / 2, // Centre Y
                distance: conn.distance
            };
        }).filter(route => route !== null);
    });

    // --- CALCUL DES ROUTES PLANÈTES ---
    protected routesPlanetes = computed(() => {
        const planetes = this.listePlanete();
        const connexions = this.listePlaneteConnexion();
        
        return connexions.map(conn => {
            const planA = planetes.find(p => p.id === conn.idPlaneteA);
            const planB = planetes.find(p => p.id === conn.idPlaneteB);

            if (!planA || !planB) return null;

            const x1 = (planA.positionX - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const y1 = (planA.positionY - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const x2 = (planB.positionX - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const y2 = (planB.positionY - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);

            return {
                x1, y1, x2, y2,
                midX: (x1 + x2) / 2, // Centre X
                midY: (y1 + y2) / 2, // Centre Y
                distance: conn.distance
            };
        }).filter(route => route !== null);
    });

    // ==========================================
// DONNÉES DE TEST : HAUT COMMANDEMENT UNSC
// ==========================================

readonly MOCK_SYSTEMES: Systeme[] = [
    { id: 1, nom: "Système Sol", description: "Berceau de l'humanité et siège de FLEETCOM.", positionX: 5, positionY: 5 },
    { id: 2, nom: "Epsilon Eridani", description: "Pôle militaire principal. Forteresse de l'UNSC.", positionX: 8, positionY: 3 },
    { id: 3, nom: "Epsilon Indi", description: "Colonie agricole majeure.", positionX: 2, positionY: 7 },
    { id: 4, nom: "Proxima Centauri", description: "Avant-poste de recherche de l'O.N.I.", positionX: 4, positionY: 3 }
];

readonly MOCK_SYSTEMES_CONNEXIONS: SystemeConnecter[] = [
    { idSystemeA: 1, idSystemeB: 2, distance: "10.5 AL" }, // Sol vers Epsilon Eridani
    { idSystemeA: 1, idSystemeB: 4, distance: "4.2 AL" },  // Sol vers Proxima
    { idSystemeA: 2, idSystemeB: 3, distance: "12.0 AL" }, // Eridani vers Indi
    { idSystemeA: 4, idSystemeB: 3, distance: "8.5 AL" }   // Proxima vers Indi
];

readonly MOCK_PLANETES: PlaneteOrigine[] = [
    // Planètes du Système Sol (ID: 1)
    { id: 101, idSysteme: 1, nom: "Terre", description: "Capitale de l'UEG.", nomFichier: "terre.png", statut: 1, positionX: 4, positionY: 4 },
    { id: 102, idSysteme: 1, nom: "Mars", description: "Chantiers navals de Reyes.", nomFichier: "mars.png", statut: 1, positionX: 6, positionY: 5 },
    { id: 103, idSysteme: 1, nom: "Luna", description: "Centre de formation de l'Académie.", nomFichier: "luna.png", statut: 1, positionX: 3, positionY: 3 },
    
    // Planètes du Système Epsilon Eridani (ID: 2)
    { id: 201, idSysteme: 2, nom: "Reach", description: "Forteresse militaire et producteur de titane.", nomFichier: "reach.png", statut: 2, positionX: 5, positionY: 5 },
    { id: 202, idSysteme: 2, nom: "Tribute", description: "Centre industriel lourd.", nomFichier: "tribute.png", statut: 1, positionX: 7, positionY: 3 },
    
    // Planètes du Système Epsilon Indi (ID: 3)
    { id: 301, idSysteme: 3, nom: "Harvest", description: "Grenier à grain des colonies.", nomFichier: "harvest.png", statut: 3, positionX: 5, positionY: 5 }
];

readonly MOCK_PLANETES_CONNEXIONS: PlaneteConnecter[] = [
    // Routes intra-Sol
    { idPlaneteA: 101, idPlaneteB: 103, distance: "384 000 km" }, // Terre - Luna
    { idPlaneteA: 101, idPlaneteB: 102, distance: "225 M km" },   // Terre - Mars
    // Routes intra-Eridani
    { idPlaneteA: 201, idPlaneteB: 202, distance: "Courte" }      // Reach - Tribute
];

    ngOnInit(): void 
    {
      this.droit = this.authServ.RecupererDroit(EUrl.PlaneteOrigine);
        this.listeSysteme.set(this.MOCK_SYSTEMES);
        this.listeSystemeConnexion.set(this.MOCK_SYSTEMES_CONNEXIONS);
        this.listePlanete.set(this.MOCK_PLANETES);
        this.listePlaneteConnexion.set(this.MOCK_PLANETES_CONNEXIONS);
    }

    // ==========================================
    // MÉTHODES DU MOTEUR PAN & ZOOM
    // ==========================================
    
    // Zoom à la molette
    @HostListener('wheel', ['$event'])
    onWheel(event: WheelEvent): void 
    {
        if ((event.target as HTMLElement).closest('.galactic-viewport')) 
        {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.min(Math.max(0.3, this.echelle() + delta), 3); // Bloque le zoom entre 0.3x et 3x
            this.echelle.set(newScale);
        }
    }

    protected onMouseDown(event: MouseEvent | TouchEvent): void 
    {
      if (this.modeEdition() && (event.target as HTMLElement).closest('.system-node'))
            return;

        this.isDragging.set(true);
        const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
        const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
        
        this.startDragX = clientX - this.panX();
        this.startDragY = clientY - this.panY();
    }

    protected ActiverDesactiverModeEdition(): void 
    {
        this.modeEdition.set(!this.modeEdition());
        this.systemeSelectionneRoute.set(null);
    }

    protected GererClicSysteme(systeme: Systeme): void 
    {
        if (!this.modeEdition()) 
        {
            this.systemeActif.set(systeme);
            this.RecentrerCarte();
            //this.ListerPlaneteSysteme(systeme.id);
            return;
        }

        const cibleA = this.systemeSelectionneRoute();

        if (!cibleA) 
        {
            // 1er clic : On verrouille le point de départ
            this.systemeSelectionneRoute.set(systeme);
        } 
        else if (cibleA.id === systeme.id) 
        {
            // Clic sur lui-même : On annule la sélection
            this.systemeSelectionneRoute.set(null);
        } 
        else 
        {
            // 2ème clic sur un autre système : Traitement de la route
            
            // On respecte votre règle stricte : idA est toujours le plus petit
            const idMin = Math.min(cibleA.id, systeme.id);
            const idMax = Math.max(cibleA.id, systeme.id);

            // On cherche si la route existe déjà
            const routeExistante = this.listeSystemeConnexion().find(
                c => c.idSystemeA === idMin && c.idSystemeB === idMax
            );

            if (routeExistante) 
            {
                // La route existe -> ON LA DÉTRUIT
                this.listeSystemeConnexion.update(liste => 
                    liste.filter(c => !(c.idSystemeA === idMin && c.idSystemeB === idMax))
                );
                
                // TODO API : this.systemeServ.SupprimerConnexion(...)
                this.snackBarServ.Ok("Route stellaire détruite.");
            } 
            else 
            {
                // La route n'existe pas -> ON LA CRÉE
                this.listeSystemeConnexion.update(liste => [
                    ...liste, 
                    { idSystemeA: idMin, idSystemeB: idMax, distance: "INCONNUE" }
                ]);
                
                // TODO API : this.systemeServ.AjouterConnexion(...)
                this.snackBarServ.Ok("Nouvelle route stellaire établie.");
            }

            // On libère la sélection pour la prochaine manœuvre
            this.systemeSelectionneRoute.set(null);
        }
    }

    protected RetourVueGalactique(): void
    {
        this.systemeActif.set(null);
        this.RecentrerCarte();
        this.listePlanete.set([]);
    }

    @HostListener('window:mouseup')
    @HostListener('window:touchend')
    protected onMouseUp(): void 
    {
        this.isDragging.set(false);
    }

    @HostListener('window:mousemove', ['$event'])
    @HostListener('window:touchmove', ['$event'])
    protected onMouseMove(event: MouseEvent | TouchEvent): void 
    {
        if (!this.isDragging()) return;
        
        const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
        const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
        
        this.panX.set(clientX - this.startDragX);
        this.panY.set(clientY - this.startDragY);
    }

    protected RecentrerCarte(): void
    {
        this.echelle.set(1);
        this.panX.set(0);
        this.panY.set(0);
    }

    protected onNodeDragEnd(event: CdkDragEnd, systeme: Systeme): void 
    {
        // On divise la distance de la souris par l'échelle de zoom
        // pour obtenir la distance "réelle" sur la grille holographique.
        const distanceX = event.distance.x / this.echelle();
        const distanceY = event.distance.y / this.echelle();

        // On convertit les pixels corrigés en cases de grille (1 case = 100px)
        const casesX = Math.round(distanceX / this.TAILLE_CASE);
        const casesY = Math.round(distanceY / this.TAILLE_CASE);

        // S'il n'a pas bougé d'une case complète, on annule visuellement
        if (casesX === 0 && casesY === 0) 
        {
            event.source._dragRef.reset();
            return;
        }

        // Calcul des nouvelles coordonnées (empêche de sortir dans des zones négatives)
        const newX = Math.max(1, systeme.positionX + casesX); 
        const newY = Math.max(1, systeme.positionY + casesY);

        // VÉRIFICATION DES COLLISIONS
        const collision = this.listeSysteme().find(s => s.id !== systeme.id && s.positionX === newX && s.positionY === newY);

        if (collision) 
        {
            this.snackBarServ.Erreur(`Alerte de collision : Ce secteur est déjà occupé par ${collision.nom}`);
            event.source._dragRef.reset(); // Rétractation à la case de départ
        } 
        else 
        {
            // SAUVEGARDE ET DÉPLACEMENT
            this.listeSysteme.update(liste => {
                const sys = liste.find(s => s.id === systeme.id);
                if (sys) {
                    sys.positionX = newX;
                    sys.positionY = newY;
                }
                return [...liste];
            });

            event.source._dragRef.reset();
        }
    }

    protected onContextMenu(event: MouseEvent): void 
    {
        event.preventDefault();

        if (!this.droit?.peutEcrire) 
            return;

        const gridElement = event.currentTarget as HTMLElement;
        const rect = gridElement.getBoundingClientRect();

        const xReel = (event.clientX - rect.left) / this.echelle();
        const yReel = (event.clientY - rect.top) / this.echelle();

        const caseX = Math.floor(xReel / this.TAILLE_CASE) + 1;
        const caseY = Math.floor(yReel / this.TAILLE_CASE) + 1;

        if (caseX < 1 || caseX > 100 || caseY < 1 || caseY > 100) 
            return;

        let caseOccupee = false;
        
        if (!this.systemeActif()) 
            caseOccupee = this.listeSysteme().some(s => s.positionX === caseX && s.positionY === caseY);

        else 
            caseOccupee = this.listePlanete().some(p => p.positionX === caseX && p.positionY === caseY);

        if (caseOccupee) 
            return;

        this.clicX.set(caseX);
        this.clicY.set(caseY);

        this.contextMenuPosition.x = event.clientX + 'px';
        this.contextMenuPosition.y = event.clientY + 'px';

        this.contextMenuTrigger().openMenu();
    }

    protected OuvrirModalAjouterSysteme(): void 
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierSysteme, { 
            width: this.estMobile ? "95%" : "60%", 
            maxWidth: "100vw",
            data: {
                positionX: this.clicX(), 
                positionY: this.clicY() 
            }
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour: Systeme | null) =>
            {
                if(retour)
                    this.listeSysteme.update(x => [...x, retour]);
            }
        });
    }

    protected OuvrirModalAjouterPlanete(): void 
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierPlaneteOrigine, {
            width: this.estMobile ? "95%" : "60%", 
            maxWidth: "100vw",
            data: {
                idSysteme: this.systemeActif().id,
                positionX: this.clicX(),
                positionY: this.clicY()
            }
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour: PlaneteOrigine | null) =>
            {
                if(retour)
                    this.listePlanete.update(x => [...x, retour])
            }
        });
    }

    protected ObtenirLibelleStatut(statut: EStatusPlanete): string 
    {
        switch (statut) 
        {
            case EStatusPlanete.ControleUNSC: return "Contrôle UNSC";
            case EStatusPlanete.ControleCvenante: return "Contrôle Covenant";
            case EStatusPlanete.InsurrectionPartielle: return "Insurrection partielle";
            case EStatusPlanete.InsurrectionTotal: return "Insurrection totale";
            case EStatusPlanete.Neutre: return "Système Neutre";
            case EStatusPlanete.Inconnu: return "Statut Inconnu";
            case EStatusPlanete.HorsRegistre: return "Hors Registre (O.N.I.)";
            case EStatusPlanete.EnGuerre: return "Zone de Guerre Active";
            case EStatusPlanete.Vitrifier: return "Vitrifiée";
            case EStatusPlanete.VitrifierPartielle: return "Vitrification Partielle";
            default: return "Données corrompues";
        }
    }

    protected ObtenirCouleurStatut(statut: EStatusPlanete): string 
    {
        switch (statut) 
        {
            case EStatusPlanete.ControleUNSC: return "#00a8ff"; // Bleu clair
            case EStatusPlanete.ControleCvenante: return "#9c88ff"; // Violet
            case EStatusPlanete.InsurrectionPartielle: return "#fbc531"; // Jaune
            case EStatusPlanete.InsurrectionTotal: return "#e1b12c"; // Orange
            case EStatusPlanete.EnGuerre: return "#e84118"; // Rouge vif
            case EStatusPlanete.Vitrifier: return "#2f3640"; // Gris cendre très sombre
            case EStatusPlanete.VitrifierPartielle: return "#7158e2"; // Violet sombre/brûlé
            case EStatusPlanete.HorsRegistre: return "#00cec9"; // Cyan (Furtif)
            default: return "#7f8fa6"; // Gris neutre par défaut
        }
    }

    private ListerPlaneteConnexion(): void 
    {
        this.planeteServ.ListerConnexion().subscribe({ next: (retour) => this.listePlaneteConnexion.set(retour) });
    }

    private ListerPlaneteSysteme(_idSysteme: number): void 
    {
        this.planeteServ.Lister(_idSysteme).subscribe({ next: (retour) => this.listePlanete.set(retour) });
    }

    private ListerSysteme(): void 
    {
        this.systemeServ.Lister().subscribe({ next: (retour) => this.listeSysteme.set(retour) });
        this.systemeServ.ListerConnexion().subscribe({ next: (retour) => this.listeSystemeConnexion.set(retour) });
    }
}