import { Component, ElementRef, OnInit, OnDestroy, viewChild, inject, signal, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SessionCombatService } from '@services/SessionCombatService';
import { Application, Container, Sprite, Assets, FederatedPointerEvent, Graphics } from 'pixi.js';
import { ModalAjouterSession } from './modal-ajouter-session/modal-ajouter-session';
import { switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { DecorRequete } from '@models/Decor';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

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
    idSession: number;
    idPion: string;
    isDragging: boolean;
    isRotating: boolean;
    dragOffset: { x: number; y: number };
}

export interface DecorVisualisation
{
    idDecor: string;
    idSession: number;
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
    idSession: number;
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

    private pionSelectionne: PionInteractifEtat | null = null;
    private redimensionnementObservateur?: ResizeObserver;

    private decorSelectionne: DecorInteractifEtat | null = null;

    private dialog = inject(MatDialog);
    protected idSessionActuelle = signal<number | null>(null);
    protected spriteFond = signal<Sprite>(null);

    async ngOnInit(): Promise<void>
    {
        await this.initialiserPixi();
        this.configurerPanEtZoom();
        this.configurerEcouteursGlobaux();
    }

    protected ouvrirModalCreationSession(): void
    {
        console.log("zzzz");

        const ref = this.dialog.open(ModalAjouterSession,
            {
                width: '450px'
            });

        ref.afterClosed().subscribe((resultat) =>
        {
            if (!resultat)
                return;

            // 1. Initialisation de la session en BDD
            this.sessionService.NouvelleSession(resultat.nom).pipe(
                switchMap((idSession: number) =>
                {
                    this.idSessionActuelle.set(idSession);
                    // 2. Upload de l'image de fond avec les dimensions calculées
                    return this.sessionService.AjouterFond(
                        idSession,
                        resultat.fichierFond,
                        resultat.hauteur,
                        resultat.largeur
                    );
                })
            ).subscribe({
                next: async (urlImageServeur: string) =>
                {
                    // 3. Mise à jour des dimensions et chargement visuel dans PixiJS
                    await this.appliquerFondDeCarte(urlImageServeur, resultat.largeur, resultat.hauteur);
                },
                error: (err) => console.error("Erreur lors de l'initialisation de la session :", err)
            });
        });
    }

    private async appliquerFondDeCarte(urlImage: string, largeur: number, hauteur: number): Promise<void>
    {
        this.carteLargeur = largeur;
        this.carteHauteur = hauteur;
        this.ratioFondOriginal = largeur / (hauteur || 1);

        this.layerFond.removeChildren();

        const texture = await Assets.load(urlImage);
        this.spriteFond.set(new Sprite(texture));
        this.spriteFond().width = largeur;
        this.spriteFond().height = hauteur;

        this.layerFond.addChild(this.spriteFond());
        this.recentrerVue();
    }

    protected changerLargeurFond(nouvelleLargeur: number): void
    {
        if (nouvelleLargeur <= 200) return;
        this.carteLargeur = Number(nouvelleLargeur);

        if (this.conserverRatio())
        {
            this.carteHauteur = Math.round(this.carteLargeur / this.ratioFondOriginal);
        }

        this.actualiserRenduFond();
    }

    protected changerHauteurFond(nouvelleHauteur: number): void
    {
        if (nouvelleHauteur <= 200) return;
        this.carteHauteur = Number(nouvelleHauteur);

        if (this.conserverRatio())
        {
            this.carteLargeur = Math.round(this.carteHauteur * this.ratioFondOriginal);
        }

        this.actualiserRenduFond();
    }

    protected sauvegarderDimensionsFond(): void
    {
        const idSession = this.idSessionActuelle();
        if (!idSession)
            return;

        this.sessionService.ModifierFondTransform(idSession, {
            largeur: this.carteLargeur,
            hauteur: this.carteHauteur
        }).subscribe({
            next: () => console.log('Dimensions de carte mises à jour en base.'),
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

        // Si réservé au MJ, légère transparence pour indiquer son statut masqué aux joueurs
        if (decor.visibiliteMode === 1)
        {
            decorContainer.alpha = 0.65;
        }

        // 1. Sprite
        const texture = await Assets.load(decor.urlSprite);
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.eventMode = 'static';
        sprite.cursor = 'grab';
        decorContainer.addChild(sprite);

        // 2. Poignée de rotation (cyan)
        const rayonDistance = (sprite.height / 2) + 30;
        const poigneeRotation = new Graphics()
            .circle(0, -rayonDistance, 8)
            .fill({ color: 0x00e5ff, alpha: 0.9 })
            .stroke({ width: 2, color: 0xffffff });
        poigneeRotation.eventMode = 'static';
        poigneeRotation.cursor = 'crosshair';
        poigneeRotation.visible = false;
        decorContainer.addChild(poigneeRotation);

        // 3. Poignée d'échelle (jaune)
        const poigneeEchelle = new Graphics()
            .rect(sprite.width / 2 + 8, sprite.height / 2 + 8, 14, 14)
            .fill({ color: 0xffcc00, alpha: 0.9 })
            .stroke({ width: 2, color: 0xffffff });
        poigneeEchelle.eventMode = 'static';
        poigneeEchelle.cursor = 'nwse-resize';
        poigneeEchelle.visible = false;
        decorContainer.addChild(poigneeEchelle);

        // menu contextuelle
        sprite.on('rightclick', (e: FederatedPointerEvent) =>
        {
            e.stopPropagation();

            // Positionne l'ancre invisible là où l'utilisateur a cliqué
            this.menuPosition = {
                x: `${e.client.x}px`,
                y: `${e.client.y}px`
            };

            this.decorCibleMenu.set({
                container: decorContainer,
                sprite,
                poigneeRotation,
                poigneeEchelle,
                idSession: decor.idSession,
                idDecor: decor.idDecor,
                ordreCalque: decor.ordreCalque,
                visibiliteMode: decor.visibiliteMode,
                isDragging: false,
                isRotating: false,
                isScaling: false,
                dragOffset: { x: 0, y: 0 }
            });

            // Ouvre le menu Angular Material
            this.decorMenuTrigger().openMenu();
        });

        // --- Sélections et manipulations ---
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
                idSession: decor.idSession,
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

        // Activation du tri par calque
        this.layerDecors.sortableChildren = true;
        this.layerDecors.addChild(decorContainer);
    }

    protected basculerVisibiliteDecor(decor: DecorInteractifEtat): void 
    {
        const nouveauMode = decor.visibiliteMode === 0 ? 1 : 0;
        decor.visibiliteMode = nouveauMode;

        // Feedback visuel immédiat pour le MJ : opacité réduite (65%) si masqué aux joueurs
        decor.container.alpha = nouveauMode === 1 ? 0.85 : 1.0;

        const rotDegres = (decor.container.rotation * 180) / Math.PI;

        // Persistance vers l'API backend
        this.sessionService.ModifierDecorTransform(decor.idSession, {
            idDecor: decor.idDecor,
            positionX: Math.round(decor.container.x),
            positionY: Math.round(decor.container.y),
            rotationDegres: ((rotDegres % 360) + 360) % 360,
            ordreCalque: decor.ordreCalque,
            visibiliteMode: nouveauMode,
            echelle: Number(decor.container.scale.x.toFixed(3))
        }).subscribe();
    }

    protected supprimerDecor(decor: DecorInteractifEtat): void 
    {
        this.layerDecors.removeChild(decor.container);
        decor.container.destroy({ children: true });
        this.deselectionnerTout();
        this.sessionService.SupprimerDecor(decor.idSession, decor.idDecor).subscribe();
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
            // Si on a cliqué sur un décor ou un pion, stopPropagation() aura déjà empêché d'arriver ici
            if (e.button === 0 || e.button === 1)
            {
                this.isDragging.set(true);
                startPanX = e.global.x - this.viewport.x;
                startPanY = e.global.y - this.viewport.y;

                // Désélectionne si on clique dans le vide spatial
                if (e.target === this.app.stage || e.target === this.layerFond || (this.spriteFond() && e.target === this.spriteFond()))
                {
                    this.deselectionnerTout();
                }
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

                const rotDegres = (this.decorSelectionne.container.rotation * 180) / Math.PI;

                this.sessionService.ModifierDecorTransform(this.decorSelectionne.idSession, {
                    idDecor: this.decorSelectionne.idDecor,
                    positionX: Math.round(this.decorSelectionne.container.x),
                    positionY: Math.round(this.decorSelectionne.container.y),
                    rotationDegres: ((rotDegres % 360) + 360) % 360,
                    ordreCalque: this.decorSelectionne.ordreCalque,
                    visibiliteMode: this.decorSelectionne.visibiliteMode,
                    echelle: Number(this.decorSelectionne.container.scale.x.toFixed(3))
                }).subscribe();
            }

            // Sauvegarde Pion
            if (this.pionSelectionne && (this.pionSelectionne.isDragging || this.pionSelectionne.isRotating))
            {
                this.pionSelectionne.isDragging = false;
                this.pionSelectionne.isRotating = false;
                this.pionSelectionne.sprite.cursor = 'grab';

                const rotDegres = (this.pionSelectionne.container.rotation * 180) / Math.PI;

                this.sessionService.ModifierPionTransform(this.pionSelectionne.idSession, {
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
        idSession: number,
        idPion: string,
        urlSprite: string,
        posX: number,
        posY: number,
        rotationDegres: number,
        armes: ArmeVisualisation[] = []
    ): Promise<void>
    {
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

        const rayonDistance = sprite.height / 2 + 35;
        const poignee = new Graphics()
            .circle(0, -rayonDistance, 8)
            .fill({ color: 0x00ffcc, alpha: 0.85 })
            .stroke({ width: 2, color: 0xffffff });

        poignee.eventMode = 'static';
        poignee.cursor = 'crosshair';
        poignee.visible = false;
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
                idSession,
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
    }

    protected onUploadDecor(event: Event): void
    {
        const input = event.target as HTMLInputElement;
        const session = this.idSessionActuelle();
        if (!input.files || input.files.length === 0 || !session) return;

        const fichier = input.files[0];

        // Calcul du centre visible de l'écran converti dans l'espace du monde PixiJS
        const centreEcranGlobal = {
            x: this.app.screen.width / 2,
            y: this.app.screen.height / 2
        };
        const centreMonde = this.viewport.toLocal(centreEcranGlobal);

        // Bornage à l'intérieur des limites de la carte
        const posX = Math.max(0, Math.min(this.carteLargeur, centreMonde.x));
        const posY = Math.max(0, Math.min(this.carteHauteur, centreMonde.y));

        const requete: DecorRequete = {
            idSession: session,
            fichier,
            positionX: Math.round(posX),
            positionY: Math.round(posY),
            echelle: 1,
            rotationDegres: 0,
            ordreCalque: this.layerDecors.children.length,
            visibiliteMode: 0
        };

        this.sessionService.AjouterDecor(requete).subscribe({
            next: async (retour) =>
            {
                await this.instancierDecorInteractif({
                    idDecor: retour.idDecor,
                    idSession: session,
                    urlSprite: retour.urlImage,
                    positionX: requete.positionX,
                    positionY: requete.positionY,
                    rotationDegres: requete.rotationDegres,
                    echelle: requete.echelle,
                    ordreCalque: requete.ordreCalque,
                    visibiliteMode: requete.visibiliteMode
                });
                input.value = '';
            },
            error: (err) => console.error("Erreur lors de l'ajout du décor :", err)
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