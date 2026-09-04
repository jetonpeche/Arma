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
import { CdkDragEnd, CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { EStatusPlanete, ETypePlanete, EAppartenancePlanete } from '@enums/EStatusPlanete';
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierPlaneteOrigine } from '@modals/ajouter-modifier-planete-origine/ajouter-modifier-planete-origine';
import { AjouterModifierSysteme } from '@modals/ajouter-modifier-systeme/ajouter-modifier-systeme';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { ModalDistanceConnexion } from './modal-distance-connexion/modal-distance-connexion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ElementRef } from '@angular/core';
import { SecteurService } from '@services/SecteurService';
import { Secteur, SecteurSynchroniser } from '@models/Secteur';
import { AjouterModifierSecteur } from '@modals/ajouter-modifier-secteur/ajouter-modifier-secteur';
import { MatSelectModule } from '@angular/material/select';

type OutilEdition = 'main' | 'pinceau' | 'gomme' | 'orbite' | 'orbite-ronde' | 'orbite-decalage';

@Component({
  selector: 'app-carte-galactique',
  imports: [MatSelectModule, FormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatMenuModule, DragDropModule, MatTooltipModule, MatIconModule, MatButtonModule, UpperCasePipe],
  templateUrl: './carte-galactique.html',
  styleUrl: './carte-galactique.scss',
})
export class CarteGalactique implements OnInit
{
    protected listeSysteme = signal<Systeme[]>([]);
    protected listePlanete = signal<PlaneteOrigine[]>([]);
    protected listeSecteur = signal<Secteur[]>([]);
    protected listeSystemeConnexion = signal<SystemeConnecter[]>([]);
    protected listePlaneteConnexion = signal<PlaneteConnecter[]>([]);
    protected droit: Droit;

    // --- MOTEUR PAN & ZOOM ---
    protected echelle = signal<number>(1);
    protected panX = signal<number>(0);
    protected panY = signal<number>(0);
    protected isDragging = signal<boolean>(false);

    protected viewport = viewChild.required<ElementRef>('viewport');
    protected rechercheSysteme = signal<string>("");
    protected rechercheAstre = signal<string>("");

    // --- MENU CONTEXTUEL ---
    protected contextMenuTrigger = viewChild.required(MatMenuTrigger);
    protected clicX = signal<number>(0);
    protected clicY = signal<number>(0);
    protected planeteCibleMenu = signal<PlaneteOrigine>(null);
    protected systemeCibleMenu = signal<Systeme>(null);

    protected eTypePlanete = ETypePlanete;
    protected eStatusPlanete = EStatusPlanete;

    // Position de l'ancre invisible sur l'écran
    protected contextMenuPosition = { x: '0px', y: '0px' };
    protected astreSelectionneDetails = signal<any | null>(null);

    protected modeEdition = signal<boolean>(false);
    protected planeteEditionOrbite = signal<PlaneteOrigine | null>(null);
    protected systemeActif = signal<Systeme | null>(null);
    protected systemeSelectionneRoute = signal<Systeme | null>(null);
    protected planeteSelectionneRoute = signal<PlaneteOrigine | null>(null);

    // --- MENU PEINTURE ---
    protected outilActif = signal<OutilEdition>('main');
    protected secteurActifId = signal<number | null>(null);
    protected verrouFrontiere = signal<boolean>(true);
    protected estEnTrainDePeindre = signal<boolean>(false);

    protected archiveSecteurs = new Map<string, number>(); 
    protected brouillonSecteurs = signal<Map<string, number>>(new Map()); 
    
    private startDragX = 0;
    private startDragY = 0;
    private readonly TAILLE_CASE = 100;
    private readonly estMobile = window.innerWidth <= 800;

    private planeteServ = inject(PlaneteService);
    private systemeServ = inject(SystemeService);
    private secteurServ = inject(SecteurService);
    private authServ = inject(AuthentificationService);
    private snackBarServ = inject(SnackBarService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private dialog = inject(MatDialog);

    protected routesSystemes = computed(() => this.GenererLignesSpatiales(this.listeSysteme(), this.listeSystemeConnexion(), 'idSystemeA', 'idSystemeB'));
    protected routesPlanetes = computed(() => this.GenererLignesSpatiales(this.listePlanete(), this.listePlaneteConnexion(), 'idPlaneteA', 'idPlaneteB'));
    protected systemesFiltres = computed(() => 
    {
        const terme = this.rechercheSysteme()?.toLowerCase().trim();
        const systemes = this.listeSysteme();

        if (!terme) 
            return systemes;

        return systemes.filter(s => s.nom.toLowerCase().includes(terme));
    });

    protected astresFiltres = computed(() => 
    {
        const terme = this.rechercheAstre()?.toLowerCase().trim();
        const astresValides = this.listePlanete().filter(a => a.statut != EStatusPlanete.RocheSpatial);

        if (!terme) 
            return astresValides; 

        return astresValides.filter(a => a.nom.toLowerCase().includes(terme));
    });

    protected cellulesPeintes = computed(() => 
    {
        const cellules = [];
        this.brouillonSecteurs().forEach((idSecteur, cle) => {
            const [x, y] = cle.split('-').map(Number);
            cellules.push({ cle, x, y, idSecteur });
        });

        return cellules;
    });

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.PlaneteOrigine);

        this.ListerSysteme();
        this.ListerSecteur();
        this.ListerPlaneteConnexion();
    }
    
    // Zoom à la molette
    @HostListener('wheel', ['$event'])
    onWheel(event: WheelEvent): void 
    {
        const viewport = (event.target as HTMLElement).closest('.galactic-viewport') as HTMLElement;
        
        if (viewport) 
        {
            event.preventDefault();
            
            const oldScale = this.echelle();
            const delta = event.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.min(Math.max(0.1, oldScale + delta), 3);

            // Si l'échelle n'a pas changé (on est au zoom minimum ou maximum), on ne fait rien
            if (oldScale == newScale) 
                return;

            // 1. On récupère la position de la souris par rapport à l'écran du radar
            const rect = viewport.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // 2. Calcul du nouveau décalage (Pan) pour garder le point sous la souris intact
            const newPanX = mouseX - ((mouseX - this.panX()) / oldScale) * newScale;
            const newPanY = mouseY - ((mouseY - this.panY()) / oldScale) * newScale;

            // 3. Application simultanée des nouvelles coordonnées
            this.echelle.set(newScale);
            this.panX.set(newPanX);
            this.panY.set(newPanY);
        }
    }

    protected AfficherNomSysteme(systeme: Systeme): string 
    {
        return systeme ? systeme.nom.toUpperCase() : '';
    }

    protected AfficherNomAstre(astre: any): string 
    {
        return astre ? astre.nom.toUpperCase() : '';
    }

    protected ModifierSecteurActif(): void
    {
        const secteurActuel = this.listeSecteur().find(s => s.id == this.secteurActifId());
        
        if (secteurActuel)
            this.OuvrirModalAjouterModifierSecteur(secteurActuel);
    }
    
    protected NaviguerVersSysteme(systeme: Systeme): void 
    {
        if (!systeme) return;

        // 1. On quitte la vue système (si on y était)
        this.systemeActif.set(null);
        this.listePlanete.set([]);

        // 2. On fixe l'échelle à un niveau de zoom confortable (ex: 100%)
        const cibleEchelle = 1;
        this.echelle.set(cibleEchelle);

        // 3. Calcul du centre de l'écran radar
        const ecranRect = this.viewport().nativeElement.getBoundingClientRect();
        const ecranCentreX = ecranRect.width / 2;
        const ecranCentreY = ecranRect.height / 2;

        // 4. Calcul de la position du système en pixels sur la grille
        const systemePixelsX = (systeme.positionX - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
        const systemePixelsY = (systeme.positionY - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);

        // 5. Compensation : on décale la carte pour que le système tombe pile au centre
        this.panX.set(ecranCentreX - (systemePixelsX * cibleEchelle));
        this.panY.set(ecranCentreY - (systemePixelsY * cibleEchelle));

        // 6. Nettoyage de la barre de recherche
        this.rechercheSysteme.set("");
    }

    protected NaviguerVersAstre(astre: any): void 
    {
        if (!astre) 
            return;

        const cibleEchelle = 1.5; 
        this.echelle.set(cibleEchelle);

        // 2. Calcul du centre de l'écran radar
        const ecranRect = this.viewport().nativeElement.getBoundingClientRect();
        const ecranCentreX = ecranRect.width / 2;
        const ecranCentreY = ecranRect.height / 2;

        // 3. Calcul de la position de l'astre en pixels sur la grille
        const astrePixelsX = (astre.positionX - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
        const astrePixelsY = (astre.positionY - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);

        // 4. Déplacement de la caméra
        this.panX.set(ecranCentreX - (astrePixelsX * cibleEchelle));
        this.panY.set(ecranCentreY - (astrePixelsY * cibleEchelle));

        this.rechercheAstre.set("");
    }

    protected DeplacerAstre(event: CdkDragEnd, astre: any, typeAstre: 'systeme' | 'planete'): void 
    {
        const casesX = Math.round((event.distance.x / this.echelle()) / this.TAILLE_CASE);
        const casesY = Math.round((event.distance.y / this.echelle()) / this.TAILLE_CASE);

        if (casesX == 0 && casesY == 0)
            return event.source._dragRef.reset();

        const newX = Math.max(1, astre.positionX + casesX); 
        const newY = Math.max(1, astre.positionY + casesY);

        // 1. Détection des collisions selon la vue
        let collision = null;
        if (typeAstre === 'systeme') {
            collision = this.listeSysteme().find(s => s.id !== astre.id && s.positionX === newX && s.positionY === newY);
        } else {
            collision = this.listePlanete().find(p => (typeAstre !== 'planete' || p.id !== astre.id) && p.positionX === newX && p.positionY === newY);
        }

        if (collision) {
            this.snackBarServ.Erreur(`Alerte de collision : Secteur occupé.`);
            return event.source._dragRef.reset();
        }

        // 2. Routage vers le bon service API
        const service = typeAstre === 'systeme' ? this.systemeServ : this.planeteServ;
        const listeSignal = typeAstre === 'systeme' ? this.listeSysteme : this.listePlanete;

        service.ModifierPosition(astre.id, { positionX: newX, positionY: newY }).subscribe({
            next: () => {
                listeSignal.update(liste => {
                    const cible = liste.find(x => x.id === astre.id);
                    if (cible) { cible.positionX = newX; cible.positionY = newY; }
                    return [...liste];
                });
                event.source._dragRef.reset();
            }
        });
    }

    protected onDragStarted(event: CdkDragStart): void 
    {
        // Force l'arrêt du déplacement de la carte dès qu'un astre est attrapé
        this.isDragging.set(false);

        if (event.event)
            event.event.stopPropagation();
    }

    protected onMouseDown(event: MouseEvent | TouchEvent): void 
    {
        const targetElement = event.target as HTMLElement;
        
        if (targetElement.closest('.grid-node')) 
        {
            // Si l'outil Orbite est actif, on verrouille la cible pour la dessiner
            if (this.modeEdition() && (this.outilActif() === 'orbite' || this.outilActif() === 'orbite-ronde' || this.outilActif() === 'orbite-decalage') && this.systemeActif())            
            {
                const gridElement = this.viewport().nativeElement.querySelector('.tactical-grid');
                const rect = gridElement.getBoundingClientRect();
                const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
                const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

                const caseX = Math.floor(((clientX - rect.left) / this.echelle()) / this.TAILLE_CASE) + 1;
                const caseY = Math.floor(((clientY - rect.top) / this.echelle()) / this.TAILLE_CASE) + 1;

                const planete = this.listePlanete().find(p => p.positionX === caseX && p.positionY === caseY);

                if (planete) 
                    this.planeteEditionOrbite.set(planete);
            }

            return; 
        }
        
        this.astreSelectionneDetails.set(null);
        const estClicDroit = event instanceof MouseEvent && event.button === 2;

        if (this.modeEdition() && !this.systemeActif() && this.outilActif() != 'main') 
        {
            if (!estClicDroit) 
            {
                this.estEnTrainDePeindre.set(true);
                this.AppliquerPeinture(event);
                return;
            }
        }

        this.isDragging.set(true);
        const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
        const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
        
        this.startDragX = clientX - this.panX();
        this.startDragY = clientY - this.panY();
    }

    protected ActiverDesactiverModeEdition(): void 
    {
        this.modeEdition.set(!this.modeEdition());
        this.outilActif.set('main');
        this.systemeSelectionneRoute.set(null);
        this.planeteSelectionneRoute.set(null);
        this.astreSelectionneDetails.set(null);
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

        if (this.outilActif() != 'main') 
            return;

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

    protected GererClicPlanete(planete: PlaneteOrigine): void 
    {
        if (!this.modeEdition()) 
        {
            this.astreSelectionneDetails.set(
                this.astreSelectionneDetails()?.id == planete.id ? null : planete
            );
            return;
        }

        if (this.outilActif() !== 'main') 
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
        this.astreSelectionneDetails.set(null);
        this.RecentrerCarte();
        this.listePlanete.set([]);
    }

    @HostListener('window:mouseup')
    @HostListener('window:touchend')
    protected onMouseUp(): void 
    {
        this.isDragging.set(false);
        this.estEnTrainDePeindre.set(false);
        
        // On relâche l'orbite (Vous pourrez ajouter un appel API de sauvegarde ici plus tard)
        this.planeteEditionOrbite.set(null);
    }

    @HostListener('window:mousemove', ['$event'])
    @HostListener('window:touchmove', ['$event'])
    protected onMouseMove(event: MouseEvent | TouchEvent): void 
    {
        const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
        const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

        if (this.planeteEditionOrbite()) 
        {
            const planete = this.planeteEditionOrbite();
            const gridElement = this.viewport().nativeElement.querySelector('.tactical-grid');
            const rect = gridElement.getBoundingClientRect();

            // Coordonnées de la souris et de la planète
            const xReel = (clientX - rect.left) / this.echelle();
            const yReel = (clientY - rect.top) / this.echelle();
            const pX = (planete.positionX - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const pY = (planete.positionY - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);

            // Calcul du vecteur
            const dx = xReel - pX;
            const dy = yReel - pY;
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            const diametre = Math.round(distance * 2);
            const angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));

            // Mise à jour visuelle instantanée
            this.listePlanete.update(liste => 
            {
                const cible = liste.find(p => p.id === planete.id);
                if (this.outilActif() === 'orbite-decalage') 
                {
                    // On déplace le centre de l'orbite vers la souris
                    cible.orbiteDecalageX = Math.round(dx);
                    cible.orbiteDecalageY = Math.round(dy);
                } 
                else 
                {
                    // On redimensionne (Ovale ou Rond)
                    cible.orbiteX = diametre;
                    cible.orbiteY = this.outilActif() === 'orbite-ronde' ? diametre : Math.round(diametre * 0.5);
                    cible.orbiteAngle = angle;
                }
                return [...liste];
            });
            return; 
        }

        if (this.estEnTrainDePeindre()) 
        {
            this.AppliquerPeinture(event);
            return;
        }

        if (!this.isDragging()) return;

        this.panX.set(clientX - this.startDragX);
        this.panY.set(clientY - this.startDragY);
    }

   protected RecentrerCarte(): void
    {
        const ecranRect = this.viewport().nativeElement.getBoundingClientRect();
        const screenW = ecranRect.width;
        const screenH = ecranRect.height;

        // 1. Déterminer quelles cibles on doit encadrer selon la vue (Macro ou Micro)
        let noeudsVisibles: any[] = [];
        
        if (!this.systemeActif()) {
            // VUE MACRO : On englobe tous les systèmes
            noeudsVisibles = this.listeSysteme();
        } else {
            // VUE MICRO : On englobe les planètes, le soleil, les lunes et les astéroïdes
            noeudsVisibles = this.listePlanete();
        }

        // S'il n'y a rien sur le radar, on se place au centre exact de la grille (Case 50,50)
        if (noeudsVisibles.length === 0) 
        {
            const vueGlobaleEchelle = 0.1;
            this.echelle.set(vueGlobaleEchelle);
            this.panX.set((screenW / 2) - (5000 * vueGlobaleEchelle));
            this.panY.set((screenH / 2) - (5000 * vueGlobaleEchelle));
            return;
        }

        // 2. Recherche des coordonnées extrêmes (Nord, Sud, Est, Ouest)
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        noeudsVisibles.forEach(n => {
            if (n.positionX < minX) minX = n.positionX;
            if (n.positionX > maxX) maxX = n.positionX;
            if (n.positionY < minY) minY = n.positionY;
            if (n.positionY > maxY) maxY = n.positionY;
        });

        // 3. Conversion des cases en pixels (avec 2 cases de marge pour respirer)
        minX = (minX - 2) * this.TAILLE_CASE;
        maxX = (maxX + 1) * this.TAILLE_CASE;
        minY = (minY - 2) * this.TAILLE_CASE;
        maxY = (maxY + 1) * this.TAILLE_CASE;

        const largeurZone = maxX - minX;
        const hauteurZone = maxY - minY;
        const centreZoneX = minX + (largeurZone / 2);
        const centreZoneY = minY + (hauteurZone / 2);

        // 4. Calcul du niveau de zoom parfait pour tout faire rentrer
        const scaleX = screenW / largeurZone;
        const scaleY = screenH / hauteurZone;
        let echelleIdeale = Math.min(scaleX, scaleY);
        
        // Sécurité : On bloque l'échelle entre 0.1 (très reculé) et 1.5 (pour ne pas trop zoomer s'il n'y a qu'une planète)
        echelleIdeale = Math.min(Math.max(0.1, echelleIdeale), 1.5);

        // 5. Exécution de la translation géométrique
        this.echelle.set(echelleIdeale);
        this.panX.set((screenW / 2) - (centreZoneX * echelleIdeale));
        this.panY.set((screenH / 2) - (centreZoneY * echelleIdeale));
    }

    protected AppliquerPeinture(event: MouseEvent | TouchEvent): void 
    {
        const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
        const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

        const gridElement = this.viewport().nativeElement.querySelector('.tactical-grid');

        if(!gridElement) 
            return;

        const rect = gridElement.getBoundingClientRect();
        const caseX = Math.floor(((clientX - rect.left) / this.echelle()) / this.TAILLE_CASE) + 1;
        const caseY = Math.floor(((clientY - rect.top) / this.echelle()) / this.TAILLE_CASE) + 1;

        if (caseX < 1 || caseX > 100 || caseY < 1 || caseY > 100) 
            return;

        const cle = `${caseX}-${caseY}`;
        const mapActuelle = new Map(this.brouillonSecteurs());
        const secteurExistant = mapActuelle.get(cle);

        if (this.outilActif() == 'pinceau' && this.secteurActifId()) 
        {
            // Vérification du VERROU FRONTIÈRE
            if (secteurExistant && this.verrouFrontiere() && secteurExistant !== this.secteurActifId()) 
                return; 

            mapActuelle.set(cle, this.secteurActifId());
        } 
        else if (this.outilActif() == 'gomme') 
            mapActuelle.delete(cle);

        this.brouillonSecteurs.set(mapActuelle);
    }

    protected SauvegarderSecteurs(): void 
    {
        const payload: SecteurSynchroniser = {
            listeCaseAjouter: [],
            listeCaseModifier: [],
            listeCaseSupprimer: []
        };

        this.brouillonSecteurs().forEach((idSecteur, cle) => 
        {
            const [x, y] = cle.split('-').map(Number);
            const ancienSecteur = this.archiveSecteurs.get(cle);

            if (ancienSecteur === undefined)
                payload.listeCaseAjouter.push({ positionX: x, positionY: y, idSecteur: idSecteur });

            else if (ancienSecteur != idSecteur)
                payload.listeCaseModifier.push({ positionX: x, positionY: y, idSecteurNouveau: idSecteur });
        });

        this.archiveSecteurs.forEach((ancienSecteur, cle) => 
        {
            if (!this.brouillonSecteurs().has(cle)) 
            {
                const [x, y] = cle.split('-').map(Number);
                payload.listeCaseSupprimer.push({ positionX: x, positionY: y });
            }
        });

        this.secteurServ.Synchroniser(payload).subscribe({
            next: () => {
                this.AppliquerSynchronisationLocale();
            },
            error: () => this.snackBarServ.Erreur("Échec de la transmission au serveur.")
        });
    }

    protected onContextMenu(event: MouseEvent): void 
    {
        event.preventDefault(); 

        // Ne pas ouvrir le menu si on navigue au click droit avec un pinceau ou gomme
        if (this.modeEdition() && !this.systemeActif() && this.outilActif() != 'main')
            return;

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

        // On cherche si un astre occupe la case visée
        if (!this.systemeActif()) 
        {
            const sys = this.listeSysteme().find(s => s.positionX == caseX && s.positionY == caseY);
            if (sys) this.systemeCibleMenu.set(sys);
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

    protected OuvrirModalAjouterModifierSecteur(secteur?: Secteur): void 
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierSecteur, { 
            width: this.estMobile ? "95%" : "400px", 
            maxWidth: "100vw",
            data: secteur 
        });

        DIALOG_REF.afterClosed().subscribe(retour => {
            if (retour) this.ListerSecteur();
        });
    }

    protected OuvrirModalConfirmationSuppression(): void
    {
        let messageCible = "";
        
        if (this.planeteCibleMenu()) 
            messageCible = "de la planète " + this.planeteCibleMenu().nom;

        else if (this.systemeCibleMenu()) 
            messageCible = "du système " + this.systemeCibleMenu().nom + " et de tous ses astres";

        const MESSAGE = `Confirmez-vous la suppression ${messageCible} ?`;

        this.dialogConfirmationServ.Ouvrir("Suppression galactique", MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                {
                    if (this.planeteCibleMenu()) 
                        this.SupprimerPlanete();

                    else if (this.systemeCibleMenu()) 
                        this.SupprimerSysteme();
                }
            }
        });
    }

    protected ObtenirCouleurSecteur(idSecteur: number): string 
    {
        return this.listeSecteur().find(s => s.id == idSecteur)?.couleurHexa || 'transparent';
    }

    protected ObtenirSecteur(idSecteur: number | null): Secteur | undefined 
    {
        if (!idSecteur) 
            return undefined;
        
        return this.listeSecteur().find(s => s.id == idSecteur);
    }

    protected ObtenirCouleurAppartenance(appartenance: EAppartenancePlanete): string 
    {
        switch (appartenance)
        {
            case EAppartenancePlanete.Humain:
            case EAppartenancePlanete.UNSC: return "#00a8ff";
            case EAppartenancePlanete.Convenant: return "#9c88ff";
            case EAppartenancePlanete.Insurrection: return "#fbc531";
            case EAppartenancePlanete.Brute: return "#e84118";
            case EAppartenancePlanete.Parasite: return "#A0522D";
            case EAppartenancePlanete.Foreneur: return "#00cec9";
            case EAppartenancePlanete.ClassifierONI: return "#2d3436";
            case EAppartenancePlanete.Neutre:
            default: return "#7f8fa6";
        }
    }

    protected GenererTableauDensite(densite: number): number[] 
    {
        // Sécurité : minimum 1 roche, maximum 3
        const quantite = Math.max(1, Math.min(3, densite || 1));

        return Array(quantite).fill(0);
    }

    protected ObtenirLibelleStatut(statut: EStatusPlanete): string 
    {
        switch (statut) 
        {
            case EStatusPlanete.Vitrifier: return "Vitrifiée";
            case EStatusPlanete.VitrifierPartielle: return "Vitrification Partielle";
            case EStatusPlanete.EnGuerre: return "En Guerre";
            case EStatusPlanete.EnPaix: return "En Paix";
            case EStatusPlanete.RocheSpatial: return "Roche Spatiale";
            case EStatusPlanete.Inhabiter: return "Inhabité";
            case EStatusPlanete.ControlPartiel: return "Contrôle Partiel";
            case EStatusPlanete.ControlTotal: return "Contrôle Total";
            case EStatusPlanete.ClassifierONI: return "Classifié O.N.I.";
            default: return "Inconnu";
        }
    }

    protected ObtenirLibelleType(type: ETypePlanete): string 
    {
        switch (type) 
        {
            case ETypePlanete.Planete: return "Planète";
            case ETypePlanete.Lune: return "Lune / Satellite";
            case ETypePlanete.Asteroide: return "Champ d'astéroïdes";
            case ETypePlanete.Soleil: return "Étoile Centrale";
            case ETypePlanete.Halo: return "Installation Halo";
            case ETypePlanete.StationCivil: return "Station Civile";
            case ETypePlanete.StationMilitaire: return "Station Militaire";
            default: return "Astre Inconnu";
        }
    }

    protected ObtenirLibelleAppartenance(appartenance: EAppartenancePlanete): string 
    {
        switch (appartenance) 
        {
            case EAppartenancePlanete.Humain: return "Humanité";
            case EAppartenancePlanete.Insurrection: return "Insurrection";
            case EAppartenancePlanete.Convenant: return "Alliance Covenante";
            case EAppartenancePlanete.Parasite: return "Le Parasite";
            case EAppartenancePlanete.Brute: return "Brutes";
            case EAppartenancePlanete.Neutre: return "Non-Aligné";
            case EAppartenancePlanete.ClassifierONI: return "Classifié O.N.I.";
            case EAppartenancePlanete.UNSC: return "U.N.S.C.";
            case EAppartenancePlanete.Foreneur: return "Forerunner";
            default: return "Inconnue";
        }
    }

    private AppliquerSynchronisationLocale(): void 
    {
        // 1. On met à jour l'Archive de sécurité pour qu'elle corresponde au Brouillon
        this.archiveSecteurs.clear();
        this.brouillonSecteurs().forEach((idSecteur, cle) => {
            this.archiveSecteurs.set(cle, idSecteur);
        });

        // 2. On reconstruit les listes de positions dans listeSecteur localement
        this.listeSecteur.update(secteursCourants => {
            
            // On vide les positions actuelles de chaque secteur
            const secteursMisAJour = secteursCourants.map(secteur => ({
                ...secteur,
                listePosition: []
            }));

            // On repeuple avec le brouillon parfait
            this.brouillonSecteurs().forEach((idSecteur, cle) => {
                const [x, y] = cle.split('-').map(Number);
                
                const secteurCible = secteursMisAJour.find(s => s.id === idSecteur);
                if (secteurCible) {
                    secteurCible.listePosition.push({ positionX: x, positionY: y });
                }
            });

            return secteursMisAJour;
        });

        this.snackBarServ.Ok("Topographie synchronisée");
    }

    private GenererLignesSpatiales(astres: any[], connexions: any[], cleIdA: string, cleIdB: string) 
    {
        return connexions.map(conn => {
            const astA = astres.find(a => a.id === conn[cleIdA]);
            const astB = astres.find(a => a.id === conn[cleIdB]);

            if (!astA || !astB) return null;

            const x1 = (astA.positionX - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const y1 = (astA.positionY - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const x2 = (astB.positionX - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);
            const y2 = (astB.positionY - 1) * this.TAILLE_CASE + (this.TAILLE_CASE / 2);

            return { x1, y1, x2, y2, midX: (x1 + x2) / 2, midY: (y1 + y2) / 2, distance: conn.distance };
        }).filter(route => route !== null);
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

    private ListerSecteur(): void
    {
        this.secteurServ.Lister().subscribe({ 
            next: (retour) => 
            {
                this.listeSecteur.set(retour);
                this.archiveSecteurs.clear();
                const initialMap = new Map<string, number>();
                
                retour.forEach(secteur => 
                {
                    if (secteur.listePosition) 
                    {
                        secteur.listePosition.forEach(pos => 
                        {
                            const cle = `${pos.positionX}-${pos.positionY}`;
                            this.archiveSecteurs.set(cle, secteur.id);
                            initialMap.set(cle, secteur.id);
                        });
                    }
                });

                this.brouillonSecteurs.set(initialMap);
                
                if (retour.length > 0) 
                    this.secteurActifId.set(retour[0].id);
            },
            error: (err) => console.error("Erreur Radar Secteurs :", err)
        });
    }
}