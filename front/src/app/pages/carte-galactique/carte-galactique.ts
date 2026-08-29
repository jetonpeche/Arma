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
import { ModalDistanceConnexion } from './modal-distance-connexion/modal-distance-connexion';
import { Asteroide, AsteroideConnecter } from '@models/Asteroide';
import { EStatutAsteroide } from '@enums/EStatusAsteroide';
import { AsteroideService } from '@services/AsteroideService';
import { AjouterModifierAsteroide } from '@modals/ajouter-modifier-asteroide/ajouter-modifier-asteroide';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ElementRef } from '@angular/core';

@Component({
  selector: 'app-carte-galactique',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatDividerModule, MatMenuModule, DragDropModule, MatTooltipModule, MatIconModule, MatButtonModule, UpperCasePipe],
  templateUrl: './carte-galactique.html',
  styleUrl: './carte-galactique.scss',
})
export class CarteGalactique implements OnInit
{
  protected listeSysteme = signal<Systeme[]>([]);
  protected listePlanete = signal<PlaneteOrigine[]>([]);
  protected listeAsteroide = signal<Asteroide[]>([]);
  protected listeSystemeConnexion = signal<SystemeConnecter[]>([]);
  protected listePlaneteConnexion = signal<PlaneteConnecter[]>([]);
  protected listeAsteroideConnexion = signal<AsteroideConnecter[]>([]);
  protected droit: Droit;

    // --- MOTEUR PAN & ZOOM ---
    protected echelle = signal<number>(1);
    protected panX = signal<number>(0);
    protected panY = signal<number>(0);
    protected isDragging = signal<boolean>(false);

    protected viewport = viewChild.required<ElementRef>('viewport');
    protected rechercheSysteme = signal<string>("");

    // --- MENU CONTEXTUEL ---
    protected contextMenuTrigger = viewChild.required(MatMenuTrigger);
    protected clicX = signal<number>(0);
    protected clicY = signal<number>(0);
    protected planeteCibleMenu = signal<PlaneteOrigine>(null);
    protected systemeCibleMenu = signal<Systeme>(null);
    protected asteroideCibleMenu = signal<Asteroide>(null);

    // Position de l'ancre invisible sur l'écran
    protected contextMenuPosition = { x: '0px', y: '0px' };
    protected astreSelectionneDetails = signal<any | null>(null);

    protected modeEdition = signal<boolean>(false);
    protected systemeActif = signal<Systeme | null>(null);
    protected systemeSelectionneRoute = signal<Systeme | null>(null);
    protected planeteSelectionneRoute = signal<PlaneteOrigine | null>(null);
    protected asteroideSelectionneRoute = signal<Asteroide | null>(null);
    
    private startDragX = 0;
    private startDragY = 0;
    private readonly TAILLE_CASE = 100;
    private readonly estMobile = window.innerWidth <= 800;

    private planeteServ = inject(PlaneteService);
    private systemeServ = inject(SystemeService);
    private asteroideServ = inject(AsteroideService);
    private authServ = inject(AuthentificationService);
    private snackBarServ = inject(SnackBarService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private dialog = inject(MatDialog);

    protected routesSystemes = computed(() => this.GenererLignesSpatiales(this.listeSysteme(), this.listeSystemeConnexion(), 'idSystemeA', 'idSystemeB'));
    protected routesPlanetes = computed(() => this.GenererLignesSpatiales(this.listePlanete(), this.listePlaneteConnexion(), 'idPlaneteA', 'idPlaneteB'));
    protected routesAsteroides = computed(() => this.GenererLignesSpatiales(this.listeAsteroide(), this.listeAsteroideConnexion(), 'idAsteroideA', 'idAsteroideB'));
    protected systemesFiltres = computed(() => 
    {
        const terme = this.rechercheSysteme()?.toLowerCase().trim();
        const systemes = this.listeSysteme();

        if (!terme) 
            return systemes;

        return systemes.filter(s => s.nom.toLowerCase().includes(terme));
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
        const viewport = (event.target as HTMLElement).closest('.galactic-viewport') as HTMLElement;
        
        if (viewport) 
        {
            event.preventDefault();
            
            const oldScale = this.echelle();
            const delta = event.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.min(Math.max(0.3, oldScale + delta), 3); // Bloque le zoom entre 0.3x et 3x

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

    protected NaviguerVersSysteme(systeme: Systeme): void 
    {
        if (!systeme) return;

        // 1. On quitte la vue système (si on y était)
        this.systemeActif.set(null);
        this.listePlanete.set([]);
        this.listeAsteroide.set([]);

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

    protected DeplacerAstre(event: CdkDragEnd, astre: any, typeAstre: 'systeme' | 'planete' | 'asteroide'): void 
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
            collision = this.listePlanete().find(p => (typeAstre !== 'planete' || p.id !== astre.id) && p.positionX === newX && p.positionY === newY) 
                     || this.listeAsteroide().find(a => (typeAstre !== 'asteroide' || a.id !== astre.id) && a.positionX === newX && a.positionY === newY);
        }

        if (collision) {
            this.snackBarServ.Erreur(`Alerte de collision : Secteur occupé.`);
            return event.source._dragRef.reset();
        }

        // 2. Routage vers le bon service API
        const service = typeAstre === 'systeme' ? this.systemeServ : (typeAstre === 'planete' ? this.planeteServ : this.asteroideServ);
        const listeSignal = typeAstre === 'systeme' ? this.listeSysteme : (typeAstre === 'planete' ? this.listePlanete : this.listeAsteroide);

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

    protected onMouseDown(event: MouseEvent | TouchEvent): void 
    {
        if (this.modeEdition() && (event.target as HTMLElement).closest('.system-node'))
            return;

        if (!(event.target as HTMLElement).closest('.grid-node')) 
        {
            this.astreSelectionneDetails.set(null);
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
        this.systemeSelectionneRoute.set(null);
        this.planeteSelectionneRoute.set(null);
        this.asteroideSelectionneRoute.set(null);
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

    protected GererClicAsteroide(asteroide: Asteroide): void 
    {
        if (!this.modeEdition()) 
        {
            this.astreSelectionneDetails.set(
                this.astreSelectionneDetails()?.id == asteroide.id ? null : asteroide
            );
            return;
        }

        const cibleA = this.asteroideSelectionneRoute();
        const cibleB = asteroide.id;

        if (!cibleA) 
            this.asteroideSelectionneRoute.set(asteroide);

        else if (cibleA.id == asteroide.id) 
            this.asteroideSelectionneRoute.set(null);

        else 
        { 
            const routeExistante = this.listeAsteroideConnexion().find( c => 
                (c.idAsteroideA === cibleA.id && c.idAsteroideB === cibleB) ||
                (c.idAsteroideA === cibleB && c.idAsteroideB === cibleA.id)
            );

            if (routeExistante) 
            {
                this.asteroideServ.SupprimerConnexion({ idAsteroideA: cibleA.id, idAsteroideB: cibleB }).subscribe({
                    next: () =>
                    {
                        this.listeAsteroideConnexion.update(liste =>
                            liste.filter(c => 
                                !( (c.idAsteroideA === cibleA.id && c.idAsteroideB === cibleB) || 
                                (c.idAsteroideA === cibleB && c.idAsteroideB === cibleA.id) )
                            )
                        );
                        
                        this.snackBarServ.Ok("Route astéroide détruite");
                    }
                });
            } 
            else 
            {
                const DIALOG_REF = this.dialog.open(ModalDistanceConnexion, {
                    width: "400px",
                    data: { nomCibleA: cibleA.nom, nomCibleB: asteroide.nom }
                });

                DIALOG_REF.afterClosed().subscribe({
                    next: (distanceSaisie: string | null) => 
                    {
                        // annuler
                        if (distanceSaisie === undefined || distanceSaisie === null) 
                        {
                            this.asteroideSelectionneRoute.set(null);
                            return;
                        }

                        this.asteroideServ.AjouterConnexion({ idAsteroideA: cibleA.id, idAsteroideB: cibleB, distance: distanceSaisie }).subscribe({
                            next: () =>
                            {
                                this.listeAsteroideConnexion.update(liste => [
                                    ...liste, 
                                    { idAsteroideA: cibleA.id, idAsteroideB: cibleB, distance: distanceSaisie }
                                ]);
                                
                                this.snackBarServ.Ok("Nouvelle route astéroide établie");
                                this.asteroideSelectionneRoute.set(null);
                            },
                            error: () => this.asteroideSelectionneRoute.set(null)
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
        this.listeAsteroide.set([]);
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
            noeudsVisibles = [...this.listePlanete(), ...this.listeAsteroide()];
        }

        // S'il n'y a rien sur le radar, on se place au centre exact de la grille (Case 50,50)
        if (noeudsVisibles.length === 0) 
        {
            const vueGlobaleEchelle = 0.3;
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
        
        // Sécurité : On bloque l'échelle entre 0.3 (très reculé) et 1.5 (pour ne pas trop zoomer s'il n'y a qu'une planète)
        echelleIdeale = Math.min(Math.max(0.3, echelleIdeale), 1.5);

        // 5. Exécution de la translation géométrique
        this.echelle.set(echelleIdeale);
        this.panX.set((screenW / 2) - (centreZoneX * echelleIdeale));
        this.panY.set((screenH / 2) - (centreZoneY * echelleIdeale));
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
        this.asteroideCibleMenu.set(null);

        // On cherche si un astre occupe la case visée
        if (!this.systemeActif()) 
        {
            const sys = this.listeSysteme().find(s => s.positionX == caseX && s.positionY == caseY);
            if (sys) this.systemeCibleMenu.set(sys);
        } 
        else 
        {
            const planete = this.listePlanete().find(p => p.positionX == caseX && p.positionY == caseY);
            const asteroide = this.listeAsteroide().find(a => a.positionX == caseX && a.positionY == caseY);

            if (planete) 
                this.planeteCibleMenu.set(planete);

            else if (asteroide) 
                this.asteroideCibleMenu.set(asteroide);
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

    protected OuvrirModalAjouterModifierAsteroide(): void 
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierAsteroide, {
            width: this.estMobile ? "95%" : "60%", 
            maxWidth: "100vw",
            data: this.asteroideCibleMenu() ?? {
                idSysteme: this.systemeActif().id,
                positionX: this.clicX(),
                positionY: this.clicY()
            }
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour: Asteroide | null) =>
            {
                const estUneModification = this.asteroideCibleMenu() !== null;
                this.asteroideCibleMenu.set(null);

                if(retour)
                {
                    if(estUneModification)
                    {
                        this.listeAsteroide.update(liste => 
                            liste.map(x => x.id === retour.id ? retour : x)
                        );
                    }
                    else
                        this.listeAsteroide.update(x => [...x, retour]);
                }
            }
        });
    }

    protected OuvrirModalConfirmationSuppression(): void
    {
        let messageCible = "";
        
        if (this.planeteCibleMenu()) 
            messageCible = "de la planète " + this.planeteCibleMenu().nom;

        else if (this.asteroideCibleMenu()) 
            messageCible = "de l'astéroïde " + this.asteroideCibleMenu().nom;

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

                    else if (this.asteroideCibleMenu()) 
                        this.SupprimerAsteroide();

                    else if (this.systemeCibleMenu()) 
                        this.SupprimerSysteme();
                }
            }
        });
    }

    protected EstUnSoleil(statut: EStatusPlanete): boolean 
    {
        return statut == EStatusPlanete.Soleil; 
    }

    protected EstUneLune(statut: EStatusPlanete): boolean 
    {
        return statut == EStatusPlanete.Lune; 
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
            case EStatusPlanete.Soleil: return "Étoile Centrale";
            case EStatusPlanete.Lune: return "Lune / Satellite";
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
            case EStatusPlanete.Soleil: return "#f1c40f";
            case EStatusPlanete.Lune: return "#dcdde1";
            default: return "#7f8fa6"; // Gris neutre par défaut
        }
    }

    protected ObtenirLibelleStatutAsteroide(statut: EStatutAsteroide): string 
    {
        switch (statut) 
        {
            case EStatutAsteroide.Neutre: return "Roche spatiale standard";
            case EStatutAsteroide.Coloniser: return "Colonisé";
            default: return "Roche spatiale standard";
        }
    }

    protected ObtenirCouleurStatutAsteroide(statut: any): string 
    {
        switch (statut) 
        {
            case EStatutAsteroide.Neutre: return "#7f8fa6";
            case EStatutAsteroide.Coloniser: return "#00a8ff";
            default: return "#7f8fa6"; // Gris rocheux par défaut
        }
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

    private SupprimerAsteroide(): void
    {
        const ID = this.asteroideCibleMenu().id;
        
        this.asteroideServ.Supprimer(ID).subscribe({
            next: () =>
            {
                this.snackBarServ.Ok("Le champ d'astéroïdes a été pulvérisé par l'artillerie navale.");
                this.listeAsteroide.update(x => x.filter(y => y.id != ID));
                this.listeAsteroideConnexion.update(x => x.filter(y => !(y.idAsteroideA == ID || y.idAsteroideB == ID)))
                
                this.asteroideCibleMenu.set(null);
            }
        });
    }

    private ListerPlaneteConnexion(): void 
    {
        this.planeteServ.ListerConnexion().subscribe({ next: (retour) => this.listePlaneteConnexion.set(retour) });
        this.asteroideServ.ListerConnexion().subscribe({ next: (retour) => this.listeAsteroideConnexion.set(retour) });
    }

    private ListerPlaneteSysteme(_idSysteme: number): void 
    {
        this.planeteServ.Lister(_idSysteme).subscribe({ next: (retour) => this.listePlanete.set(retour) });
        this.asteroideServ.Lister(_idSysteme).subscribe({ next: (retour) => this.listeAsteroide.set(retour) });
    }

    private ListerSysteme(): void 
    {
        this.systemeServ.Lister().subscribe({ next: (retour) => this.listeSysteme.set(retour) });
        this.systemeServ.ListerConnexion().subscribe({ next: (retour) => this.listeSystemeConnexion.set(retour) });
    }
}