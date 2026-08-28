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
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { sys } from 'typescript';
import { ModalDistanceConnexion } from './modal-distance-connexion/modal-distance-connexion';

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
    protected planeteCibleMenu = signal<PlaneteOrigine>(null);
    protected systemeCibleMenu = signal<Systeme>(null);

    // Position de l'ancre invisible sur l'écran
    protected contextMenuPosition = { x: '0px', y: '0px' };

    protected modeEdition = signal<boolean>(false);
    protected systemeActif = signal<Systeme | null>(null);
    protected systemeSelectionneRoute = signal<Systeme | null>(null);
    protected planeteSelectionneRoute = signal<PlaneteOrigine | null>(null);
    
    private startDragX = 0;
    private startDragY = 0;
    private readonly TAILLE_CASE = 100;
    private readonly estMobile = window.innerWidth <= 800;

    private planeteServ = inject(PlaneteService);
    private systemeServ = inject(SystemeService);
    private authServ = inject(AuthentificationService);
    private snackBarServ = inject(SnackBarService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
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

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.PlaneteOrigine);

        this.ListerSysteme();
        this.ListerPlaneteConnexion();
    }
    
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
        this.planeteSelectionneRoute.set(null);
    }

    protected GererClicSysteme(systeme: Systeme): void 
    {
        if (!this.modeEdition()) 
        {
            this.systemeActif.set(systeme);
            this.RecentrerCarte();
            this.ListerPlaneteSysteme(systeme.id);
            return;
        }

        const cibleA = this.systemeSelectionneRoute();
        const cibleB = systeme.id;

        if (!cibleA) 
        {
            this.systemeSelectionneRoute.set(systeme);
        } 
        else if (cibleA.id == systeme.id) 
            this.systemeSelectionneRoute.set(null);

        else 
        { 
            // On cherche si la route existe déjà
            const routeExistante = this.listeSystemeConnexion().find( c => 
                (c.idSystemeA == cibleA.id && c.idSystemeB == cibleB) ||
                (c.idSystemeA == cibleB && c.idSystemeB == cibleA.id)
            );

            if (routeExistante) 
            {
                this.systemeServ.SupprimerConnexion({ idSystemeA: cibleA.id, idSystemeB: cibleB }).subscribe({
                    next: () =>
                    {
                        this.listeSystemeConnexion.update(liste =>
                            liste.filter(c => 
                                !( (c.idSystemeA === cibleA.id && c.idSystemeB === cibleB) || 
                                (c.idSystemeA === cibleB && c.idSystemeB === cibleA.id) )
                            )
                        );
                        
                        this.snackBarServ.Ok("Route stellaire détruite");
                    }
                });
            } 
            else 
            {
                const DIALOG_REF = this.dialog.open(ModalDistanceConnexion, {
                    width: "400px",
                    data: { nomCibleA: cibleA.nom, nomCibleB: systeme.nom }
                });

                DIALOG_REF.afterClosed().subscribe({
                    next: (distanceSaisie: string | null) => 
                    {
                        // annuler
                        if (distanceSaisie === undefined || distanceSaisie === null) 
                        {
                            this.systemeSelectionneRoute.set(null);
                            return;
                        }

                        this.systemeServ.AjouterConnexion({ idSystemeA: cibleA.id, idSystemeB: cibleB, distance: distanceSaisie }).subscribe({
                            next: () =>
                            {
                                this.listeSystemeConnexion.update(liste => [
                                    ...liste, 
                                    { idSystemeA: cibleA.id, idSystemeB: cibleB, distance: distanceSaisie }
                                ]);

                                this.snackBarServ.Ok("Nouvelle route stellaire établie");
                                this.systemeSelectionneRoute.set(null);
                            },
                            error: () => this.systemeSelectionneRoute.set(null)
                        });
                    }
                });
            }

            // On libère la sélection pour la prochaine manœuvre
            this.systemeSelectionneRoute.set(null);
        }
    }

    protected onPlaneteDragEnd(event: CdkDragEnd, planete: PlaneteOrigine): void 
    {
        const distanceX = event.distance.x / this.echelle();
        const distanceY = event.distance.y / this.echelle();

        const casesX = Math.round(distanceX / this.TAILLE_CASE);
        const casesY = Math.round(distanceY / this.TAILLE_CASE);

        if (casesX === 0 && casesY === 0) 
        {
            event.source._dragRef.reset();
            return;
        }

        const newX = Math.max(1, planete.positionX + casesX); 
        const newY = Math.max(1, planete.positionY + casesY);

        const collision = this.listePlanete().find(p => p.id !== planete.id && p.positionX === newX && p.positionY === newY);

        if (collision) 
        {
            this.snackBarServ.Erreur(`Alerte de collision : Ce secteur est déjà occupé par ${collision.nom}`);
            event.source._dragRef.reset(); 
        } 
        else
        {
            this.planeteServ.ModifierPosition(planete.id, { positionX: newX, positionY: newY }).subscribe({
                next: () =>
                {
                    this.listePlanete.update(liste => {
                        const p = liste.find(x => x.id === planete.id);
                        if (p) 
                        {
                            p.positionX = newX;
                            p.positionY = newY;
                        }
                        return [...liste];
                    });

                    event.source._dragRef.reset();
                    this.snackBarServ.Ok("Orbite planétaire recalibrée");
                }
            });
        }
    }

    protected GererClicPlanete(planete: PlaneteOrigine): void 
    {
        if (!this.modeEdition()) 
            return;

        const cibleA = this.planeteSelectionneRoute();
        const cibleB = planete.id;

        if (!cibleA) 
            this.planeteSelectionneRoute.set(planete);

        else if (cibleA.id == planete.id) 
            this.planeteSelectionneRoute.set(null);

        else 
        { 
            const routeExistante = this.listePlaneteConnexion().find( c => 
                (c.idPlaneteA === cibleA.id && c.idPlaneteB === cibleB) ||
                (c.idPlaneteA === cibleB && c.idPlaneteB === cibleA.id)
            );

            if (routeExistante) 
            {
                this.planeteServ.SupprimerConnexion({ idPlaneteA: cibleA.id, idPlaneteB: cibleB }).subscribe({
                    next: () =>
                    {
                        this.listePlaneteConnexion.update(liste =>
                            liste.filter(c => 
                                !( (c.idPlaneteA === cibleA.id && c.idPlaneteB === cibleB) || 
                                (c.idPlaneteA === cibleB && c.idPlaneteB === cibleA.id) )
                            )
                        );
                        
                        this.snackBarServ.Ok("Route planétaire détruite");
                    }
                });
            } 
            else 
            {
                const DIALOG_REF = this.dialog.open(ModalDistanceConnexion, {
                    width: "400px",
                    data: { nomCibleA: cibleA.nom, nomCibleB: planete.nom }
                });

                DIALOG_REF.afterClosed().subscribe({
                    next: (distanceSaisie: string | null) => 
                    {
                        // annuler
                        if (distanceSaisie === undefined || distanceSaisie === null) 
                        {
                            this.systemeSelectionneRoute.set(null);
                            return;
                        }
                        
                        this.planeteServ.AjouterConnexion({ idPlaneteA: cibleA.id, idPlaneteB: cibleB, distance: distanceSaisie }).subscribe({
                            next: () =>
                            {
                                this.listePlaneteConnexion.update(liste => [
                                    ...liste, 
                                    { idPlaneteA: cibleA.id, idPlaneteB: cibleB, distance: distanceSaisie }
                                ]);
                                
                                this.snackBarServ.Ok("Nouvelle route planétaire établie");
                                this.planeteSelectionneRoute.set(null);
                            },
                            error: () => this.planeteSelectionneRoute.set(null)
                        });
                    }
                });
            }

            this.planeteSelectionneRoute.set(null);
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
            this.systemeServ.ModifierPosition(systeme.id, { positionX: newX, positionY: newY }).subscribe({
                next: () =>
                {
                    this.listeSysteme.update(liste => {
                        const sys = liste.find(s => s.id == systeme.id);

                        if (sys) 
                        {
                            sys.positionX = newX;
                            sys.positionY = newY;
                        }

                        return [...liste];
                    });

                    event.source._dragRef.reset();
                }
            });
        }
    }

    protected onContextMenu(event: MouseEvent): void 
    {
        event.preventDefault(); 

        if (!this.droit?.peutEcrire && !this.droit?.peutSupprimer) 
            return;

        const gridElement = event.currentTarget as HTMLElement;
        const rect = gridElement.getBoundingClientRect();

        const xReel = (event.clientX - rect.left) / this.echelle();
        const yReel = (event.clientY - rect.top) / this.echelle();

        const caseX = Math.floor(xReel / this.TAILLE_CASE) + 1;
        const caseY = Math.floor(yReel / this.TAILLE_CASE) + 1;

        if (caseX < 1 || caseX > 100 || caseY < 1 || caseY > 100) return;

        // 1. On réinitialise les cibles précédentes
        this.planeteCibleMenu.set(null);
        this.systemeCibleMenu.set(null);

        // 2. On cherche si un astre occupe la case visée
        if (!this.systemeActif()) 
        {
            const sys = this.listeSysteme().find(s => s.positionX == caseX && s.positionY == caseY);

            if (sys) 
                this.systemeCibleMenu.set(sys);
        } 
        else 
        {
            const planete = this.listePlanete().find(p => p.positionX == caseX && p.positionY == caseY);

            if (planete) 
                this.planeteCibleMenu.set(planete);
        }

        // 3. Mise à jour des coordonnées
        this.clicX.set(caseX);
        this.clicY.set(caseY);
        this.contextMenuPosition.x = event.clientX + 'px';
        this.contextMenuPosition.y = event.clientY + 'px';

        this.contextMenuTrigger().openMenu();
    }

    protected OuvrirModalAjouterModifierSysteme(): void 
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierSysteme, { 
            width: this.estMobile ? "95%" : "60%", 
            maxWidth: "100vw",
            data: this.systemeCibleMenu() ?? {
                positionX: this.clicX(), 
                positionY: this.clicY() 
            }
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour: Systeme | null) =>
            {
                const estUneModification = this.systemeCibleMenu() !== null;
                this.systemeCibleMenu.set(null);

                if(retour)
                {
                    if(estUneModification)
                    {
                        this.listeSysteme.update(liste => 
                            liste.map(x => x.id === retour.id ? retour : x)
                        );
                    }
                    else
                        this.listeSysteme.update(x => [...x, retour]);
                }
            }
        });
    }

    protected OuvrirModalAjouterModifierPlanete(): void 
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierPlaneteOrigine, {
            width: this.estMobile ? "95%" : "60%", 
            maxWidth: "100vw",
            data: this.planeteCibleMenu() ?? {
                idSysteme: this.systemeActif().id,
                positionX: this.clicX(),
                positionY: this.clicY()
            }
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour: PlaneteOrigine | null) =>
            {
                const estUneModification = this.planeteCibleMenu() !== null;
                this.planeteCibleMenu.set(null);

                if(retour)
                {
                    if(estUneModification)
                    {
                        this.listePlanete.update(liste => 
                            liste.map(x => x.id === retour.id ? retour : x)
                        );
                    }
                    else
                        this.listePlanete.update(x => [...x, retour]);
                }
            }
        });
    }

    protected OuvrirModalConfirmationSuppression(): void
    {
        const MESSAGE = `Confirmez-vous la suppression ${this.planeteCibleMenu() ? ('de la planete' + this.planeteCibleMenu().nom) : ('du système' + this.systemeCibleMenu().nom + ' et de toutes ses planetes') } ?`;

        this.dialogConfirmationServ.Ouvrir("Suppression galactique", MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                {
                    this.planeteCibleMenu() ? this.SupprimerPlanete() : this.SupprimerSysteme();
                }
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

    private SupprimerSysteme(): void
    {
        const ID = this.systemeCibleMenu().id;

        this.systemeServ.Supprimer(ID).subscribe({
            next: () =>
            {
                this.snackBarServ.Ok("Le système a été supprimé");
                this.listeSysteme.update(x => x.filter(y => y.id != ID));
                this.listeSystemeConnexion.update(x => x.filter(y => !(y.idSystemeA == ID || y.idSystemeB == ID)))

                const idsPlanetesDetruites = this.listePlanete()
                    .filter(p => p.idSysteme === ID)
                    .map(p => p.id);

                this.listePlaneteConnexion.update(routes => 
                    routes.filter(r => 
                        !idsPlanetesDetruites.includes(r.idPlaneteA) && 
                        !idsPlanetesDetruites.includes(r.idPlaneteB)
                    )
                );

                this.systemeCibleMenu.set(null);
                this.RetourVueGalactique();
            }
        });
    }

    private SupprimerPlanete(): void
    {
        const ID = this.planeteCibleMenu().id;
        this.planeteServ.Supprimer(ID).subscribe({
            next: () =>
            {
                this.snackBarServ.Ok("La planete a été supprimée");
                this.listePlanete.update(x => x.filter(y => y.id != ID))
                this.listePlaneteConnexion.update(x => x.filter(y => !(y.idPlaneteA == ID || y.idPlaneteB == ID)))
                this.planeteCibleMenu.set(null);
            }
        });
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