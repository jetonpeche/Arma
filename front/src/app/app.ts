import { Component, computed, DOCUMENT, effect, inject, OnInit, Renderer2, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BooleanInput } from '@angular/cdk/coercion';
import { MatDialog } from '@angular/material/dialog';
import { ModalPanier } from '@modals/modal-panier/modal-panier';
import { environment } from '../environements/environement';
import { AuthentificationService } from '@services/AuthentificationService';
import { ModalPointBanque } from '@modals/modal-point-banque/modal-point-banque';
import { EUrl } from '@enums/EUrl';
import { DecimalPipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { ParametreService } from '@services/ParametreService';
import { SnackBarService } from '@services/SnackBarService';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-root',
  imports: [DecimalPipe, MatSliderModule, MatMenuModule, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatTooltipModule, MatListModule, MatSidenavModule, MatToolbarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit
{
    protected mdcBackdrop = signal<BooleanInput>(false);
    protected drawerMode = signal<MatDrawerMode>("push");
    protected estLightMode = signal<boolean>(false);
    protected sonEstActiver = signal<boolean>(false);
    protected currentTrack = signal<string>('');
    protected volume = signal<number>(0.3);

    private playlist: string[] = [
        '/music/theme1.mp3',
        '/music/theme2.mp3',
        '/music/theme3.mp3',
        '/music/theme4.mp3',
        '/music/theme5.mp3',
        '/music/theme6.mp3'
    ];
    
    private dialog = inject(MatDialog);
    private router = inject(Router);
    private authServ = inject(AuthentificationService);
    private paramServ = inject(ParametreService);
    private snackbarServ = inject(SnackBarService);
    private document = inject(DOCUMENT);
    private renderer = inject(Renderer2);
    private debounceTimer: any;
    private readonly estMobile = window.innerWidth <= 800;

    protected estConnecter = computed(() => this.authServ.estConnecter());
    protected pointCampagne = computed(() => this.authServ.nbPointBanque());
    protected peutModifierBanque = computed(() => this.authServ.peutModifierBanque());
    protected droit = computed(() => 
    {
        this.authServ.droitGroupe(); 
        return this.authServ.RecupererDroit(EUrl.DroitGroupe)?.peutLire ?? false;
    });

    protected droitPropositionAchat = computed(() => {
        this.authServ.droitGroupe();
        return this.authServ.RecupererDroit(EUrl.PropositionAchat)?.peutLire ?? false;
    });

    constructor(private breakpointObserver: BreakpointObserver) 
    {
        let breakpoint$ = this.breakpointObserver
        .observe([ '(max-width: 500px)']);

        breakpoint$.subscribe(() =>
            this.BreakpointChanges()
        );

        effect(() => {
            if (this.estConnecter() && environment.utilisateur)
                this.AppliquerParametresUtilisateur();
        });
    }

    ngOnInit(): void 
    {
        const userJson = sessionStorage.getItem("utilisateur");

        if (userJson) 
        {
            try 
            {
                const utilisateur = JSON.parse(userJson);
                const tokenData = JSON.parse(atob(utilisateur.jwt.split(".")[1]));
                const expirationDate = new Date(tokenData.exp * 1000);

                if (expirationDate > new Date()) 
                {
                    environment.utilisateur = utilisateur;
                    
                    this.authServ.nbPointBanque.set(utilisateur.nbPointBanque);
                    this.authServ.peutModifierBanque.set(utilisateur.droit.peutModifierBanque);
                    this.authServ.droitGroupe.set(utilisateur.droit);
                    this.authServ.estConnecter.set(true); 
                } 
                else 
                    this.Deconnexion();
            } 
            catch (e) 
            {
                console.error("Erreur lors de la restauration de la session", e);
                this.Deconnexion();
            }
        }
    }

    protected ChangerVolume(event: any): void 
    {
        // 1. Modification en direct du volume local
        const nouveauVolume = parseFloat(event.target.value);
        this.volume.set(nouveauVolume);
        
        const audio = document.getElementById('tactical-ambience') as HTMLAudioElement;
        if (audio) {
            audio.volume = nouveauVolume;
        }

        // 2. PROTOCOLE DE DEBOUNCE
        // On détruit l'ancien minuteur s'il y en avait un en cours
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // On lance un nouveau compte à rebours de 500 millisecondes (0.5s)
        this.debounceTimer = setTimeout(() => {
            this.SauvegarderVolume();
        }, 500);
    }

    protected toggleTheme(): void
    {
        this.estLightMode.set(!this.estLightMode());

        if (this.estLightMode()) 
            this.renderer.addClass(this.document.documentElement, 'light-mode');

        else 
            this.renderer.removeClass(this.document.documentElement, 'light-mode');

        this.ModifierParam();
    }

    protected toggleAudio(): void 
    {
        const audio = document.getElementById('tactical-ambience') as HTMLAudioElement;
        
        if (audio) 
        {
            if (this.sonEstActiver()) 
            {
                audio.pause();
                this.sonEstActiver.set(false);
                this.ModifierParam();
            } 
            else 
            {
                if (!this.currentTrack())
                    this.JouerProchainSonRandom(true);
                else 
                {
                    audio.volume = this.volume();
                    audio.play()
                        .then(() => {
                            this.sonEstActiver.set(true);
                            this.ModifierParam();
                        })
                        .catch(() => {
                            this.snackbarServ.Erreur("Lecture audio bloquée par les protocoles de sécurité du navigateur.");
                        });
                }
            }
        }
    }   

    protected JouerProchainSonRandom(sauvegarderChoix: boolean = false): void 
    {
        const audio = document.getElementById('tactical-ambience') as HTMLAudioElement;

        if (!audio)
            return;

        const randomIndex = Math.floor(Math.random() * this.playlist.length);
        this.currentTrack.set(this.playlist[randomIndex]);

        setTimeout(() => 
        {
            audio.load();
            audio.volume = this.volume();
            audio.play()
                .then(() => {
                    this.sonEstActiver.set(true);

                    if (sauvegarderChoix && this.estConnecter())
                        this.ModifierParam();
                })
                .catch(() => {
                    this.snackbarServ.Erreur("Lecture audio bloquée par les protocoles de sécurité du navigateur.");
                });
        }, 50);
    }

    protected Connexion(): void
    {
        this.router.navigateByUrl("/connexion");
    }

    protected Deconnexion(): void
    {
        const audio = document.getElementById('tactical-ambience') as HTMLAudioElement;
        if (audio) {
            audio.pause();
        }
        this.sonEstActiver.set(false);
        this.currentTrack.set('');
        
        this.authServ.estConnecter.set(false);
        this.authServ.peutModifierBanque.set(false);
        this.authServ.nbPointBanque.set(0);
        sessionStorage.removeItem("utilisateur");
        environment.utilisateur = null;
        this.router.navigateByUrl("/");
    }

    protected OuvrirModalModifierPoint(): void
    {
        if(this.peutModifierBanque())
            this.dialog.open(ModalPointBanque, {
                width: this.estMobile ? "95%" : "30%",
                maxWidth: "100vw"
        });
    }

    protected OuvrirModalPanier(): void
    { 
        this.dialog.open(ModalPanier, {
            width: this.estMobile ? "95%" : "70%", 
            maxWidth: "100vw",
        });
    }

    protected SauvegarderVolume(): void
    {
        if (this.estConnecter()) 
        {
            this.ModifierParam();
        }
    }

    private ModifierParam(): void
    {
        if(!this.estConnecter())
            return;

        this.paramServ.Modifier({ sonActiver: this.sonEstActiver(), volume: this.volume(), themeSombreActiver: !this.estLightMode() }).subscribe({
            next: () =>
            {
                environment.utilisateur.parametre.sonActiver = this.sonEstActiver();
                environment.utilisateur.parametre.volume = this.volume();
                environment.utilisateur.parametre.themeSombreActiver = !this.estLightMode()
                sessionStorage.setItem("utilisateur", environment.utilisateur);
            },
            error: () => this.snackbarServ.Erreur("Erreur réseau")
        });
    }

    private AppliquerParametresUtilisateur(): void 
    {
        let utilisateur = environment.utilisateur;

        const modeClair = !utilisateur.parametre.themeSombreActiver;
        this.estLightMode.set(modeClair);

        if (modeClair)
            this.renderer.addClass(this.document.documentElement, 'light-mode');

        else
            this.renderer.removeClass(this.document.documentElement, 'light-mode');

        if (utilisateur.parametre.sonActiver)
        {
            setTimeout(() => 
            {
                const audio = document.getElementById('tactical-ambience') as HTMLAudioElement;

                if (audio && !this.sonEstActiver())
                    this.JouerProchainSonRandom();
            }, 500);
        }
    }

    private BreakpointChanges(): void 
    {
        if (this.breakpointObserver.isMatched('(max-width: 500px)')) 
        {
            this.drawerMode.set("over");
            this.mdcBackdrop.set(true);
        }
        else 
        {
            this.drawerMode.set("push");      
            this.mdcBackdrop.set(false);
        }
    }
}