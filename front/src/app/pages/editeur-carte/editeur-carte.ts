import { Component, ElementRef, OnInit, OnDestroy, viewChild, inject, signal, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SessionCombatService } from '@services/SessionCombatService';
import { Application, Container, Sprite, Assets, FederatedPointerEvent, Graphics, Circle, Rectangle } from 'pixi.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { SessionCombatBibliotheque } from '@models/SessionCombat';

export interface ArmeVisualisation
{
    nom: string;
    angleOffsetDegres: number;
    angleOuvertureDegres: number;
    porteeMaximale: number;
    couleurHex: number;
}

interface PionInteractifEtat
{
    container: Container;
    sprite: Sprite;
    poignee: Graphics;
    dessinerArcs: (visible: boolean) => void;
    idPion: string;
    isDragging: boolean;
    isRotating: boolean;
    dragOffset: { x: number; y: number };
}

export interface DecorVisualisation
{
    idDecor: string;
    urlSprite: string;
    positionX: number;
    positionY: number;
    rotationDegres: number;
    echelle: number;
    ordreCalque: number;
    visibiliteMode: number;
}

interface DecorInteractifEtat
{
    container: Container;
    sprite: Sprite;
    poigneeRotation: Graphics;
    poigneeEchelle: Graphics;
    idDecor: string;
    ordreCalque: number;
    visibiliteMode: number;
    isDragging: boolean;
    isRotating: boolean;
    isScaling: boolean;
    dragOffset: { x: number; y: number };
}

@Component({
    selector: 'app-editeur-carte',
    standalone: true,
    imports: [MatDividerModule, MatMenuModule, FormsModule, MatTooltipModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
    templateUrl: './editeur-carte.html',
    styleUrl: './editeur-carte.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditeurCarte implements OnInit, OnDestroy
{
    // 2. Propriétés pour le menu contextuel dans la classe :
    protected decorMenuTrigger = viewChild.required(MatMenuTrigger);
    protected menuPosition = { x: '0px', y: '0px' };
    protected decorCibleMenu = signal<DecorInteractifEtat | null>(null);

    protected isDragging = signal<boolean>(false);
    protected conserverRatio = signal<boolean>(true);
    protected bibliothequeDecors = signal<SessionCombatBibliotheque[]>([]);
    private ratioFondOriginal = 16 / 9;

    // Configuration de la navigation souris & tactile
    private propulseursActifs = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    private boucleAnimationClavier: number | null = null;
    private vitesseNavigation = 20;

    private canvasContainer = viewChild.required<ElementRef<HTMLDivElement>>('canvasContainer');
    private sessionService = inject(SessionCombatService);

    private app!: Application;
    private viewport = new Container();
    private layerFond = new Container();
    private layerDecors = new Container();
    private layerPions = new Container();
    private layerOverlay = new Container();

    // Dimensions de la zone de bataille
    protected carteLargeur = 3840;
    protected carteHauteur = 2160;

    protected tiroirBibliothequeOuvert = signal<boolean>(false);
    private decorEnCoursDeDrag: SessionCombatBibliotheque | null = null;

    private pionSelectionne: PionInteractifEtat | null = null;
    private redimensionnementObservateur?: ResizeObserver;

    private decorSelectionne: DecorInteractifEtat | null = null;

    private listeDecorsInstancies: DecorInteractifEtat[] = [];
    private listePionsInstancies: PionInteractifEtat[] = [];

    private dragEnCours = false;
    protected spriteFond = signal<Sprite>(null);

    async ngOnInit(): Promise<void>
    {
        await this.initialiserPixi();
        this.configurerPanEtZoom();
        this.configurerEcouteursGlobaux();
        this.chargerSessionActive();
    }

    private async appliquerFondDeCarte(urlImage: string | null | undefined, largeur: number, hauteur: number): Promise<void>
    {
        this.carteLargeur = largeur || 3840;
        this.carteHauteur = hauteur || 2160;
        this.ratioFondOriginal = this.carteLargeur / (this.carteHauteur || 1);

        // 1. Nettoyage de l'existant
        this.layerFond.removeChildren();

        // 2. Si une URL valide est fournie, on instancie le Sprite
        if (urlImage && urlImage.trim() !== '')
        {
            try
            {
                const texture = await Assets.load(urlImage);
                const nouveauSprite = new Sprite(texture);
                nouveauSprite.width = this.carteLargeur;
                nouveauSprite.height = this.carteHauteur;

                this.spriteFond.set(nouveauSprite);
                this.layerFond.addChild(nouveauSprite);
            } catch (err)
            {
                console.error("Échec du chargement de l'image de fond :", err);
                this.spriteFond.set(null);
                this.dessinerGrilleParDefaut();
            }
        }
        else
        {
            // 3. Fond vide : on réinitialise le signal et on dessine la grille tactique
            this.spriteFond.set(null);
            this.dessinerGrilleParDefaut();
        }

        this.recentrerVue();
    }

    private dessinerGrilleParDefaut(): void
    {
        const fondTactique = new Graphics();

        // Fond spatial sombre
        fondTactique
            .rect(0, 0, this.carteLargeur, this.carteHauteur)
            .fill({ color: 0x070c14 })
            .stroke({ width: 3, color: 0x00a8ff, alpha: 0.6 });

        // Quadrillage tactique espacé (mailles de 200px)
        const pas = 200;
        fondTactique.beginPath();
        for (let x = pas; x < this.carteLargeur; x += pas)
        {
            fondTactique.moveTo(x, 0).lineTo(x, this.carteHauteur);
        }
        for (let y = pas; y < this.carteHauteur; y += pas)
        {
            fondTactique.moveTo(0, y).lineTo(this.carteLargeur, y);
        }
        fondTactique.stroke({ width: 1, color: 0x00a8ff, alpha: 0.08 });

        this.layerFond.addChild(fondTactique);
    }

    protected onDragStartDecor(event: DragEvent, item: SessionCombatBibliotheque): void
    {
        this.dragEnCours = true;
        this.decorEnCoursDeDrag = item;
        if (event.dataTransfer)
        {
            event.dataTransfer.setData('text/plain', item.id.toString());
            event.dataTransfer.effectAllowed = 'copy';
        }
    }

    // Autorise le drop au-dessus du canvas
    protected onDragOverCanvas(event: DragEvent): void
    {
        event.preventDefault();
        if (event.dataTransfer)
        {
            event.dataTransfer.dropEffect = 'copy';
        }
    }

    protected onDropDecorSurCanvas(event: DragEvent): void
    {
        event.preventDefault();
        if (!this.decorEnCoursDeDrag) return;

        const decorItem = this.decorEnCoursDeDrag;
        this.decorEnCoursDeDrag = null;

        // Coordonnées de dépôt converties dans l'espace du monde PixiJS
        const canvasBounds = this.app.canvas.getBoundingClientRect();
        const mouseGlobal = {
            x: event.clientX - canvasBounds.left,
            y: event.clientY - canvasBounds.top
        };
        const pointMonde = this.viewport.toLocal(mouseGlobal);

        const posX = Math.round(Math.max(0, Math.min(this.carteLargeur, pointMonde.x)));
        const posY = Math.round(Math.max(0, Math.min(this.carteHauteur, pointMonde.y)));

        const requetePlacement = {
            idBibliothequeDecor: decorItem.id,
            positionX: posX,
            positionY: posY,
            echelle: 1,
            rotationDegres: 0,
            ordreCalque: this.layerDecors.children.length,
            visibiliteMode: 0
        };

        // Sauvegarde en base et instanciation immédiate sous le curseur
        this.sessionService.PlacerDecor(requetePlacement).subscribe({
            next: async (idDecorGenere: string) =>
            {
                await this.instancierDecorInteractif({
                    idDecor: idDecorGenere,
                    urlSprite: decorItem.urlImage,
                    positionX: requetePlacement.positionX,
                    positionY: requetePlacement.positionY,
                    rotationDegres: requetePlacement.rotationDegres,
                    echelle: requetePlacement.echelle,
                    ordreCalque: requetePlacement.ordreCalque,
                    visibiliteMode: requetePlacement.visibiliteMode
                });
            },
            error: (err) => console.error("Erreur placement décor via drag & drop :", err)
        });
    }

    protected changerLargeurFond(nouvelleLargeur: number): void
    {
        if (nouvelleLargeur <= 200) return;

        const ancienneL = this.carteLargeur;
        const ancienneH = this.carteHauteur;

        this.carteLargeur = nouvelleLargeur;

        if (this.conserverRatio())
        {
            this.carteHauteur = Math.round(this.carteLargeur / this.ratioFondOriginal);
        }

        // Recalcul proportionnel des éléments
        this.recalculerPositionsElements(ancienneL, ancienneH);
        this.actualiserRenduFond();
    }

    protected changerHauteurFond(nouvelleHauteur: number): void
    {
        if (nouvelleHauteur <= 200) return;

        const ancienneL = this.carteLargeur;
        const ancienneH = this.carteHauteur;

        this.carteHauteur = nouvelleHauteur;

        if (this.conserverRatio())
        {
            this.carteLargeur = Math.round(this.carteHauteur * this.ratioFondOriginal);
        }

        // Recalcul proportionnel des éléments
        this.recalculerPositionsElements(ancienneL, ancienneH);
        this.actualiserRenduFond();
    }

    // Permet de poser le décor au centre de l'écran en un tap sur mobile
    protected placerDecorAuCentre(decorItem: SessionCombatBibliotheque): void
    {
        // Si c'était un drag ou si on est sur grand écran avec souris, on annule
        if (this.dragEnCours || window.innerWidth > 800)
        {
            this.dragEnCours = false;
            return;
        }

        const centreMonde = this.viewport.toLocal({
            x: this.app.screen.width / 2,
            y: this.app.screen.height / 2
        });

        const requetePlacement = {
            idBibliothequeDecor: decorItem.id,
            positionX: Math.round(Math.max(0, Math.min(this.carteLargeur, centreMonde.x))),
            positionY: Math.round(Math.max(0, Math.min(this.carteHauteur, centreMonde.y))),
            echelle: 1,
            rotationDegres: 0,
            ordreCalque: this.layerDecors.children.length,
            visibiliteMode: 0
        };

        this.sessionService.PlacerDecor(requetePlacement).subscribe({
            next: async (idDecorGenere: string) =>
            {
                await this.instancierDecorInteractif({
                    idDecor: idDecorGenere,
                    urlSprite: decorItem.urlImage,
                    positionX: requetePlacement.positionX,
                    positionY: requetePlacement.positionY,
                    rotationDegres: requetePlacement.rotationDegres,
                    echelle: requetePlacement.echelle,
                    ordreCalque: requetePlacement.ordreCalque,
                    visibiliteMode: requetePlacement.visibiliteMode
                });
                // Ferme automatiquement le tiroir sur mobile après sélection
                this.tiroirBibliothequeOuvert.set(false);
            }
        });
    }

    protected sauvegarderDimensionsFond(): void
    {
        // 1. Sauvegarde du fond
        this.sessionService.ModifierFondTransform({
            largeur: this.carteLargeur,
            hauteur: this.carteHauteur
        }).subscribe({
            next: () =>
            {
                // 2. Persistance des nouvelles coordonnées des décors
                for (const decor of this.listeDecorsInstancies)
                {
                    this.sauvegarderTransformDecor(decor);
                }

                // 3. Persistance des nouvelles coordonnées des pions
                for (const pion of this.listePionsInstancies)
                {
                    const rotDegres = (pion.container.rotation * 180) / Math.PI;
                    this.sessionService.ModifierPionTransform({
                        idPion: pion.idPion,
                        positionX: Math.round(pion.container.x),
                        positionY: Math.round(pion.container.y),
                        rotationDegres: ((rotDegres % 360) + 360) % 360
                    }).subscribe();
                }
            },
            error: (err) => console.error('Erreur de sauvegarde des dimensions :', err)
        });
    }

    protected async instancierDecorInteractif(decor: DecorVisualisation): Promise<void>
    {
        const decorContainer = new Container();
        decorContainer.position.set(decor.positionX, decor.positionY);
        decorContainer.rotation = (decor.rotationDegres * Math.PI) / 180;
        decorContainer.scale.set(decor.echelle || 1);
        decorContainer.zIndex = decor.ordreCalque;

        if (decor.visibiliteMode === 1)
        {
            decorContainer.alpha = 0.65;
        }

        const estTactile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const tailleVisibleRot = estTactile ? 12 : 8;

        // 1. Sprite
        const texture = await Assets.load(decor.urlSprite);
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.eventMode = 'static';
        sprite.cursor = 'grab';
        decorContainer.addChild(sprite);

        // 2. Poignée de rotation (Cyan) centrée sur (0, -rayonDistance)
        const rayonDistance = (sprite.height / 2) + (estTactile ? 45 : 30);
        const poigneeRotation = new Graphics()
            .circle(0, 0, tailleVisibleRot)
            .fill({ color: 0x00e5ff, alpha: 0.9 })
            .stroke({ width: 2, color: 0xffffff });

        poigneeRotation.position.set(0, -rayonDistance);
        poigneeRotation.eventMode = 'static';
        poigneeRotation.cursor = 'crosshair';
        poigneeRotation.visible = false;

        if (estTactile)
        {
            poigneeRotation.hitArea = new Circle(0, 0, 24);
        }
        decorContainer.addChild(poigneeRotation);

        // 3. Poignée d'échelle (Jaune) centrée sur (decalageX, decalageY)
        const tailleVisibleEch = estTactile ? 18 : 14;
        const decalageX = sprite.width / 2 + 10;
        const decalageY = sprite.height / 2 + 10;

        const poigneeEchelle = new Graphics()
            .rect(-tailleVisibleEch / 2, -tailleVisibleEch / 2, tailleVisibleEch, tailleVisibleEch)
            .fill({ color: 0xffcc00, alpha: 0.9 })
            .stroke({ width: 2, color: 0xffffff });

        poigneeEchelle.position.set(decalageX, decalageY);
        poigneeEchelle.eventMode = 'static';
        poigneeEchelle.cursor = 'nwse-resize';
        poigneeEchelle.visible = false;

        if (estTactile) 
        {
            poigneeEchelle.hitArea = new Rectangle(-22, -22, 44, 44);
        }
        decorContainer.addChild(poigneeEchelle);

        // Menu contextuel (clic droit)
        sprite.on('rightclick', (e: FederatedPointerEvent) =>
        {
            e.stopPropagation();

            this.menuPosition = {
                x: `${e.client.x}px`,
                y: `${e.client.y}px`
            };

            this.decorCibleMenu.set({
                container: decorContainer,
                sprite,
                poigneeRotation,
                poigneeEchelle,
                idDecor: decor.idDecor,
                ordreCalque: decor.ordreCalque,
                visibiliteMode: decor.visibiliteMode,
                isDragging: false,
                isRotating: false,
                isScaling: false,
                dragOffset: { x: 0, y: 0 }
            });

            this.decorMenuTrigger().openMenu();
        });

        // Événements de sélection et déplacement
        sprite.on('pointerdown', (e: FederatedPointerEvent) =>
        {
            if (e.button !== 0) return;

            this.deselectionnerTout();

            poigneeRotation.visible = true;
            poigneeEchelle.visible = true;
            sprite.cursor = 'grabbing';

            const posLocale = this.viewport.toLocal(e.global);
            this.decorSelectionne = {
                container: decorContainer,
                sprite,
                poigneeRotation,
                poigneeEchelle,
                idDecor: decor.idDecor,
                ordreCalque: decor.ordreCalque,
                visibiliteMode: decor.visibiliteMode,
                isDragging: true,
                isRotating: false,
                isScaling: false,
                dragOffset: {
                    x: posLocale.x - decorContainer.x,
                    y: posLocale.y - decorContainer.y
                }
            };
            e.stopPropagation();
        });

        poigneeRotation.on('pointerdown', (e: FederatedPointerEvent) =>
        {
            if (e.button !== 0 || !this.decorSelectionne) return;
            this.decorSelectionne.isRotating = true;
            this.decorSelectionne.isDragging = false;
            e.stopPropagation();
        });

        poigneeEchelle.on('pointerdown', (e: FederatedPointerEvent) =>
        {
            if (e.button !== 0 || !this.decorSelectionne) return;
            this.decorSelectionne.isScaling = true;
            this.decorSelectionne.isDragging = false;
            e.stopPropagation();
        });

        this.layerDecors.sortableChildren = true;
        this.layerDecors.addChild(decorContainer);

        this.listeDecorsInstancies.push({
            container: decorContainer,
            sprite,
            poigneeRotation,
            poigneeEchelle,
            idDecor: decor.idDecor,
            ordreCalque: decor.ordreCalque,
            visibiliteMode: decor.visibiliteMode,
            isDragging: false,
            isRotating: false,
            isScaling: false,
            dragOffset: { x: 0, y: 0 }
        });
    }

    protected basculerVisibiliteDecor(decor: DecorInteractifEtat): void 
    {
        decor.visibiliteMode = decor.visibiliteMode === 0 ? 1 : 0;
        decor.container.alpha = decor.visibiliteMode === 1 ? 0.65 : 1.0;
        this.sauvegarderTransformDecor(decor);
    }

    protected supprimerDecor(decor: DecorInteractifEtat): void 
    {
        this.layerDecors.removeChild(decor.container);
        decor.container.destroy({ children: true });
        this.deselectionnerTout();
        this.sessionService.SupprimerDecor(decor.idDecor).subscribe(() =>
        {
            this.listeDecorsInstancies = this.listeDecorsInstancies.filter(d => d.idDecor !== decor.idDecor);
        });
    }

    private recalculerPositionsElements(ancienneLargeur: number, ancienneHauteur: number): void
    {
        if (ancienneLargeur <= 0 || ancienneHauteur <= 0) return;

        const ratioX = this.carteLargeur / ancienneLargeur;
        const ratioY = this.carteHauteur / ancienneHauteur;

        // 1. Recalcul des positions des décors
        for (const decor of this.listeDecorsInstancies)
        {
            decor.container.x = Math.round(decor.container.x * ratioX);
            decor.container.y = Math.round(decor.container.y * ratioY);
        }

        // 2. Recalcul des positions des pions
        for (const pion of this.listePionsInstancies)
        {
            pion.container.x = Math.round(pion.container.x * ratioX);
            pion.container.y = Math.round(pion.container.y * ratioY);
        }
    }

    private deselectionnerTout(): void
    {
        if (this.pionSelectionne)
        {
            this.pionSelectionne.poignee.visible = false;
            this.pionSelectionne.dessinerArcs(false);
            this.pionSelectionne = null;
        }
        if (this.decorSelectionne)
        {
            this.decorSelectionne.poigneeRotation.visible = false;
            this.decorSelectionne.poigneeEchelle.visible = false;
            this.decorSelectionne = null;
        }
    }

    private actualiserRenduFond(): void
    {
        if (!this.spriteFond())
            return;

        // Redimensionnement du sprite PixiJS
        this.spriteFond().width = this.carteLargeur;
        this.spriteFond().height = this.carteHauteur;

        // Recentrage fluide si le fond devient plus petit que l'écran
        this.recentrerVue();
    }

    private async initialiserPixi(): Promise<void>
    {
        this.app = new Application();

        const elementConteneur = this.canvasContainer().nativeElement;

        await this.app.init({
            resizeTo: elementConteneur,
            backgroundColor: 0x0a111a,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true
        });

        elementConteneur.appendChild(this.app.canvas);

        // Arborescence
        this.viewport.addChild(this.layerFond);
        this.viewport.addChild(this.layerDecors);
        this.viewport.addChild(this.layerPions);
        this.viewport.addChild(this.layerOverlay);
        this.app.stage.addChild(this.viewport);

        // Tracé du fond de carte et bordure
        const fondZone = new Graphics()
            .rect(0, 0, this.carteLargeur, this.carteHauteur)
            .fill({ color: 0x070c14 })
            .stroke({ width: 3, color: 0x00a8ff, alpha: 0.6 });
        this.layerFond.addChild(fondZone);

        // Recentrage initial
        this.recentrerVue();

        // Surveillance responsive sans scrollbars
        this.redimensionnementObservateur = new ResizeObserver(() =>
        {
            this.app.resize();
        });
        this.redimensionnementObservateur.observe(elementConteneur);
    }

    private recentrerVue(): void
    {
        const ecranW = this.app.screen.width;
        const ecranH = this.app.screen.height;

        // Zoom initial pour afficher une bonne partie du plateau
        const echelleInitiale = Math.min(ecranW / this.carteLargeur, ecranH / this.carteHauteur) * 1.2;
        this.viewport.scale.set(Math.max(0.2, Math.min(echelleInitiale, 1)));

        this.viewport.x = (ecranW - this.carteLargeur * this.viewport.scale.x) / 2;
        this.viewport.y = (ecranH - this.carteHauteur * this.viewport.scale.y) / 2;
    }

    private configurerPanEtZoom(): void
    {
        const canvas = this.app.canvas;

        // Variables pinch zoom mobile
        let distanceInitialePinch = 0;
        let zoomInitialPinch = 1;

        // 1. Zoom molette
        canvas.addEventListener('wheel', (e: WheelEvent) =>
        {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const zoomActuel = this.viewport.scale.x;
            const nouveauZoom = Math.min(Math.max(zoomActuel * zoomFactor, 0.15), 3.0);

            if (zoomActuel === nouveauZoom) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.viewport.x = mouseX - ((mouseX - this.viewport.x) / zoomActuel) * nouveauZoom;
            this.viewport.y = mouseY - ((mouseY - this.viewport.y) / zoomActuel) * nouveauZoom;
            this.viewport.scale.set(nouveauZoom);
        }, { passive: false });

        // 2. Tactile Mobile (1 doigt = pan si aucun élément pris, 2 doigts = pinch)
        canvas.addEventListener('touchstart', (e: TouchEvent) =>
        {
            if (this.pionSelectionne?.isDragging || this.pionSelectionne?.isRotating ||
                this.decorSelectionne?.isDragging || this.decorSelectionne?.isRotating || this.decorSelectionne?.isScaling) return;

            if (e.touches.length === 1)
            {
                this.isDragging.set(true);
            } else if (e.touches.length === 2)
            {
                this.isDragging.set(false);
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                distanceInitialePinch = Math.hypot(dx, dy);
                zoomInitialPinch = this.viewport.scale.x;
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (e: TouchEvent) =>
        {
            if (this.pionSelectionne?.isDragging || this.pionSelectionne?.isRotating ||
                this.decorSelectionne?.isDragging || this.decorSelectionne?.isRotating || this.decorSelectionne?.isScaling) return;

            if (e.touches.length === 2 && distanceInitialePinch > 0)
            {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distanceActuelle = Math.hypot(dx, dy);
                const ratio = distanceActuelle / distanceInitialePinch;

                const cibleZoom = Math.min(Math.max(zoomInitialPinch * ratio, 0.15), 3.0);
                const rect = canvas.getBoundingClientRect();
                const centreX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                const centreY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

                const zoomActuel = this.viewport.scale.x;
                this.viewport.x = centreX - ((centreX - this.viewport.x) / zoomActuel) * cibleZoom;
                this.viewport.y = centreY - ((centreY - this.viewport.y) / zoomActuel) * cibleZoom;
                this.viewport.scale.set(cibleZoom);
            }
        }, { passive: true });

        const arreterTouch = () =>
        {
            this.isDragging.set(false);
            distanceInitialePinch = 0;
        };

        canvas.addEventListener('touchend', arreterTouch);
        canvas.addEventListener('touchcancel', arreterTouch);
    }

    // Déplacement avec les flèches du clavier (comme dans CarteGalactique)
    @HostListener('window:keydown', ['$event'])
    protected onKeyDown(event: KeyboardEvent): void
    {
        const target = event.target as HTMLElement;
        if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') return;

        if (this.propulseursActifs.hasOwnProperty(event.key))
        {
            this.propulseursActifs[event.key as keyof typeof this.propulseursActifs] = true;
            event.preventDefault();

            if (!this.boucleAnimationClavier)
            {
                this.lancerMoteursCamera();
            }
        }
    }
    @HostListener('window:keyup', ['$event'])
    protected onKeyUp(event: KeyboardEvent): void
    {
        if (this.propulseursActifs.hasOwnProperty(event.key))
        {
            this.propulseursActifs[event.key as keyof typeof this.propulseursActifs] = false;

            if (!this.propulseursActifs.ArrowUp && !this.propulseursActifs.ArrowDown &&
                !this.propulseursActifs.ArrowLeft && !this.propulseursActifs.ArrowRight)
            {
                if (this.boucleAnimationClavier)
                {
                    cancelAnimationFrame(this.boucleAnimationClavier);
                    this.boucleAnimationClavier = null;
                }
            }
        }
    }

    private lancerMoteursCamera(): void
    {
        const boucle = () =>
        {
            let dx = 0;
            let dy = 0;

            if (this.propulseursActifs.ArrowUp)
                dy += this.vitesseNavigation;

            if (this.propulseursActifs.ArrowDown)
                dy -= this.vitesseNavigation;

            if (this.propulseursActifs.ArrowLeft)
                dx += this.vitesseNavigation;

            if (this.propulseursActifs.ArrowRight)
                dx -= this.vitesseNavigation;

            if (dx !== 0 || dy !== 0)
            {
                this.viewport.x += dx;
                this.viewport.y += dy;
            }

            this.boucleAnimationClavier = requestAnimationFrame(boucle);
        };

        this.boucleAnimationClavier = requestAnimationFrame(boucle);
    }

    private configurerEcouteursGlobaux(): void
    {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;

        let startPanX = 0;
        let startPanY = 0;


        // Début de clic : si on clique sur le fond ou le stage, on déplace la carte
        this.app.stage.on('pointerdown', (e: FederatedPointerEvent) =>
        {
            if (e.target !== this.app.stage && e.target !== this.layerFond && (!this.spriteFond() || e.target !== this.spriteFond()))
                return;

            // Si on a cliqué sur un décor ou un pion, stopPropagation() aura déjà empêché d'arriver ici
            if (e.button === 0 || e.button === 1)
            {
                this.isDragging.set(true);
                startPanX = e.global.x - this.viewport.x;
                startPanY = e.global.y - this.viewport.y;

                // Désélectionne si on clique dans le vide spatial
                if (e.target === this.app.stage || e.target === this.layerFond || (this.spriteFond() && e.target === this.spriteFond()))
                    this.deselectionnerTout();
            }
        });

        // Mouvement global de la souris
        this.app.stage.on('pointermove', (e: FederatedPointerEvent) =>
        {
            const posLocale = this.viewport.toLocal(e.global);

            // CAS 1 : Déplacement ou manipulation d'un décor
            if (this.decorSelectionne)
            {
                if (this.decorSelectionne.isDragging)
                {
                    const cibleX = posLocale.x - this.decorSelectionne.dragOffset.x;
                    const cibleY = posLocale.y - this.decorSelectionne.dragOffset.y;
                    this.decorSelectionne.container.x = Math.max(0, Math.min(this.carteLargeur, cibleX));
                    this.decorSelectionne.container.y = Math.max(0, Math.min(this.carteHauteur, cibleY));
                }
                else if (this.decorSelectionne.isRotating)
                {
                    const dx = posLocale.x - this.decorSelectionne.container.x;
                    const dy = posLocale.y - this.decorSelectionne.container.y;
                    this.decorSelectionne.container.rotation = Math.atan2(dy, dx) + Math.PI / 2;
                }
                else if (this.decorSelectionne.isScaling)
                {
                    const dx = posLocale.x - this.decorSelectionne.container.x;
                    const dy = posLocale.y - this.decorSelectionne.container.y;
                    const distanceCurseur = Math.hypot(dx, dy);

                    // Rayon de référence basé sur la taille intrinsèque de l'image (texture native)
                    const texture = this.decorSelectionne.sprite.texture;
                    const rayonDeReference = Math.hypot(texture.width / 2, texture.height / 2) || 100;

                    // Permet de descendre jusqu'à 2% de la taille d'origine et monter jusqu'à 500%
                    const echelleCalculee = Math.max(0.02, Math.min(distanceCurseur / rayonDeReference, 5.0));

                    this.decorSelectionne.container.scale.set(echelleCalculee);
                }
                return;
            }

            // CAS 2 : Déplacement d'un pion
            if (this.pionSelectionne)
            {
                if (this.pionSelectionne.isDragging)
                {
                    const cibleX = posLocale.x - this.pionSelectionne.dragOffset.x;
                    const cibleY = posLocale.y - this.pionSelectionne.dragOffset.y;
                    this.pionSelectionne.container.x = Math.max(0, Math.min(this.carteLargeur, cibleX));
                    this.pionSelectionne.container.y = Math.max(0, Math.min(this.carteHauteur, cibleY));
                } else if (this.pionSelectionne.isRotating)
                {
                    const dx = posLocale.x - this.pionSelectionne.container.x;
                    const dy = posLocale.y - this.pionSelectionne.container.y;
                    this.pionSelectionne.container.rotation = Math.atan2(dy, dx) + Math.PI / 2;
                }
                return; // Empêche de déplacer la carte en même temps !
            }

            // CAS 3 : Déplacement de la caméra (Pan)
            if (this.isDragging())
            {
                this.viewport.x = e.global.x - startPanX;
                this.viewport.y = e.global.y - startPanY;
            }
        });

        // Arrêt de toute interaction et persistance BDD
        const arreterInteraction = () =>
        {
            this.isDragging.set(false);

            // Sauvegarde Décor
            if (this.decorSelectionne && (this.decorSelectionne.isDragging || this.decorSelectionne.isRotating || this.decorSelectionne.isScaling))
            {
                this.decorSelectionne.isDragging = false;
                this.decorSelectionne.isRotating = false;
                this.decorSelectionne.isScaling = false;
                this.decorSelectionne.sprite.cursor = 'grab';

                this.sauvegarderTransformDecor(this.decorSelectionne);
            }

            // Sauvegarde Pion
            if (this.pionSelectionne && (this.pionSelectionne.isDragging || this.pionSelectionne.isRotating))
            {
                this.pionSelectionne.isDragging = false;
                this.pionSelectionne.isRotating = false;
                this.pionSelectionne.sprite.cursor = 'grab';

                const rotDegres = (this.pionSelectionne.container.rotation * 180) / Math.PI;

                this.sessionService.ModifierPionTransform({
                    idPion: this.pionSelectionne.idPion,
                    positionX: this.pionSelectionne.container.x,
                    positionY: this.pionSelectionne.container.y,
                    rotationDegres: ((rotDegres % 360) + 360) % 360
                }).subscribe();
            }
        };

        this.app.stage.on('pointerup', arreterInteraction);
        this.app.stage.on('pointerupoutside', arreterInteraction);
    }

    protected async instancierPionInteractif(
        idPion: string,
        urlSprite: string,
        posX: number,
        posY: number,
        rotationDegres: number,
        armes: ArmeVisualisation[] = []
    ): Promise<void>
    {
        const estTactile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const tailleVisibleRot = estTactile ? 12 : 8;

        const pionContainer = new Container();
        pionContainer.position.set(posX, posY);
        pionContainer.rotation = (rotationDegres * Math.PI) / 180;

        const arcsGraphics = new Graphics();
        pionContainer.addChild(arcsGraphics);

        const texture = await Assets.load(urlSprite);
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.eventMode = 'static';
        sprite.cursor = 'grab';
        pionContainer.addChild(sprite);

        // Poignée de rotation centrée sur (0, -distancePion)
        const distancePion = sprite.height / 2 + (estTactile ? 50 : 35);
        const poignee = new Graphics()
            .circle(0, 0, tailleVisibleRot)
            .fill({ color: 0x00ffcc, alpha: 0.85 })
            .stroke({ width: 2, color: 0xffffff });

        poignee.position.set(0, -distancePion);
        poignee.eventMode = 'static';
        poignee.cursor = 'crosshair';
        poignee.visible = false;

        if (estTactile)
        {
            poignee.hitArea = new Circle(0, 0, 24);
        }
        pionContainer.addChild(poignee);

        const dessinerArcs = (visible: boolean) =>
        {
            arcsGraphics.clear();
            if (!visible) return;

            for (const arme of armes)
            {
                const portee = arme.porteeMaximale > 0 ? arme.porteeMaximale : 800;
                const demiOuvertureRad = ((arme.angleOuvertureDegres / 2) * Math.PI) / 180;
                const axeCentralRad = ((arme.angleOffsetDegres - 90) * Math.PI) / 180;
                const angleDebut = axeCentralRad - demiOuvertureRad;
                const angleFin = axeCentralRad + demiOuvertureRad;

                arcsGraphics
                    .moveTo(0, 0)
                    .arc(0, 0, portee, angleDebut, angleFin)
                    .lineTo(0, 0)
                    .fill({ color: arme.couleurHex, alpha: 0.15 })
                    .stroke({ width: 1.5, color: arme.couleurHex, alpha: 0.6 });
            }
        };

        sprite.on('pointerdown', (e: FederatedPointerEvent) =>
        {
            if (e.button !== 0) return;

            if (this.pionSelectionne && this.pionSelectionne.container !== pionContainer)
            {
                this.pionSelectionne.poignee.visible = false;
                this.pionSelectionne.dessinerArcs(false);
            }

            poignee.visible = true;
            dessinerArcs(true);
            sprite.cursor = 'grabbing';

            const posLocale = this.viewport.toLocal(e.global);
            this.pionSelectionne = {
                container: pionContainer,
                sprite,
                poignee,
                dessinerArcs,
                idPion,
                isDragging: true,
                isRotating: false,
                dragOffset: {
                    x: posLocale.x - pionContainer.x,
                    y: posLocale.y - pionContainer.y
                }
            };
            e.stopPropagation();
        });

        poignee.on('pointerdown', (e: FederatedPointerEvent) =>
        {
            if (e.button !== 0 || !this.pionSelectionne) return;
            this.pionSelectionne.isRotating = true;
            this.pionSelectionne.isDragging = false;
            e.stopPropagation();
        });

        this.layerPions.addChild(pionContainer);
        this.listePionsInstancies.push({
            container: pionContainer,
            sprite,
            poignee,
            dessinerArcs,
            idPion,
            isDragging: false,
            isRotating: false,
            dragOffset: { x: 0, y: 0 }
        });
    }

    protected viderPlateau(): void
    {
        const confirmation = window.confirm("ATTENTION : Cette action supprimera tous les pions, décors et le fond de carte de la session. Confirmer la purge ?");
        if (!confirmation) return;

        this.sessionService.Vider().subscribe({
            next: () =>
            {
                // 1. Désélectionne les éléments actifs pour éviter les références fantômes
                this.deselectionnerTout();

                // 2. Nettoie les conteneurs PixiJS
                this.layerDecors.removeChildren();
                this.layerPions.removeChildren();
                this.layerFond.removeChildren();

                // 3. Purge les listes mémoires
                this.listeDecorsInstancies = [];
                this.listePionsInstancies = [];

                // 4. Réinitialise le sprite de fond et redessine la grille tactique neutre
                this.spriteFond.set(null);
                this.dessinerGrilleParDefaut();

                this.recentrerVue();
            },
            error: (err) => console.error("Erreur lors de la purge de la session :", err)
        });
    }

    protected onUploadFond(event: Event): void
    {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0)
            return;

        const fichier = input.files[0];
        const img = new Image();
        img.src = URL.createObjectURL(fichier);

        img.onload = () =>
        {
            const largeur = img.naturalWidth;
            const hauteur = img.naturalHeight;
            URL.revokeObjectURL(img.src);

            this.sessionService.AjouterFond(fichier, hauteur, largeur).subscribe({
                next: async (urlImage) => 
                {
                    await this.appliquerFondDeCarte(urlImage, largeur, hauteur);
                    input.value = '';
                },
                error: (err) => console.error("Erreur upload fond :", err)
            });
        };
    }

    protected onUploadNouveauDecor(event: Event): void
    {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const fichier = input.files[0];
        const nomFichierNettoye = fichier.name.replace(/\.[^/.]+$/, "");

        // 1. Sauvegarde dans la bibliothèque
        this.sessionService.AjouterDecor(fichier, null, nomFichierNettoye).subscribe({
            next: (retour) =>
            {
                const idBibliotheque: number = retour.id;
                const urlImage: string = retour.urlImage;

                // Ajout local à la bibliothèque
                this.bibliothequeDecors.update(liste => [...liste, {
                    id: idBibliotheque,
                    nomRecherche: nomFichierNettoye,
                    urlImage: urlImage
                }]);

                // 2. Positionnement au centre de la caméra
                const centreMonde = this.viewport.toLocal({
                    x: this.app.screen.width / 2,
                    y: this.app.screen.height / 2
                });

                const requetePlacement = {
                    idBibliothequeDecor: idBibliotheque,
                    positionX: Math.round(Math.max(0, Math.min(this.carteLargeur, centreMonde.x))),
                    positionY: Math.round(Math.max(0, Math.min(this.carteHauteur, centreMonde.y))),
                    echelle: 1,
                    rotationDegres: 0,
                    ordreCalque: this.layerDecors.children.length,
                    visibiliteMode: 0
                };

                // 3. Placement sur le plateau
                this.sessionService.PlacerDecor(requetePlacement).subscribe({
                    next: async (idDecorGenere: string) =>
                    {
                        await this.instancierDecorInteractif({
                            idDecor: idDecorGenere,
                            urlSprite: urlImage,
                            positionX: requetePlacement.positionX,
                            positionY: requetePlacement.positionY,
                            rotationDegres: requetePlacement.rotationDegres,
                            echelle: requetePlacement.echelle,
                            ordreCalque: requetePlacement.ordreCalque,
                            visibiliteMode: requetePlacement.visibiliteMode
                        });
                        input.value = '';
                    },
                    error: (err) => console.error("Erreur placement décor :", err)
                });
            },
            error: (err) => console.error("Erreur upload décor bibliothèque :", err)
        });
    }

    protected sauvegarderTransformDecor(decor: DecorInteractifEtat): void
    {
        const rotDegres = ((decor.container.rotation * 180) / Math.PI);

        const requete = {
            idDecor: decor.idDecor,
            positionX: Math.round(decor.container.x),
            positionY: Math.round(decor.container.y),
            rotationDegres: ((rotDegres % 360) + 360) % 360,
            ordreCalque: decor.ordreCalque,
            visibiliteMode: decor.visibiliteMode,
            echelle: Number(decor.container.scale.x.toFixed(3))
        };

        this.sessionService.ModifierDecorTransform(requete).subscribe();
    }

    private chargerSessionActive(): void
    {
        this.listeDecorsInstancies = [];
        this.listePionsInstancies = [];
        this.layerDecors.removeChildren();
        this.layerPions.removeChildren();

        this.sessionService.recuperer().subscribe({
            next: async (session) =>
            {
                if (!session) return;

                this.bibliothequeDecors.set(session.bibliothequeDecor || []);

                // 1. Fond de carte
                if (session.urlImagecarte)
                {
                    await this.appliquerFondDeCarte(session.urlImagecarte, session.largeur, session.hauteur);
                }
                else
                {
                    this.carteLargeur = session.largeur || 3840;
                    this.carteHauteur = session.hauteur || 2160;
                    this.actualiserRenduFond();
                }

                // 2. Décors
                if (session.listeDecor?.length)
                {
                    for (const decor of session.listeDecor)
                    {
                        const biblioItem = this.bibliothequeDecors().find(b => b.id === decor.idBibliothequeDecor);
                        if (!biblioItem) continue;

                        await this.instancierDecorInteractif({
                            idDecor: decor.idDecor,
                            urlSprite: biblioItem.urlImage,
                            positionX: decor.positionX,
                            positionY: decor.positionY,
                            rotationDegres: decor.rotationDegres,
                            echelle: decor.echelle,
                            ordreCalque: decor.ordreCalque,
                            visibiliteMode: Number(decor.visibiliteMode)
                        });
                    }
                }

                // 3. Pions (si présents)
                if (session.listePion?.length)
                {
                    for (const pion of session.listePion)
                    {
                        await this.instancierPionInteractif(
                            pion.idPion,
                            '/assets/paris_class.png',
                            pion.positionX,
                            pion.positionY,
                            pion.rotationDegres
                        );
                    }
                }
            },
            error: (err) => console.error("Erreur de récupération de la session :", err)
        });
    }

    ngOnDestroy(): void
    {
        if (this.boucleAnimationClavier)
            cancelAnimationFrame(this.boucleAnimationClavier);

        this.redimensionnementObservateur?.disconnect();
        this.app.destroy(true, { children: true });
    }
}