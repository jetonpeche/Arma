import { AfterViewInit, Component, computed, inject, signal } from '@angular/core';
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
import { Location } from '@angular/common';
import { environment } from '../environements/environement';
import { AuthentificationService } from '@services/AuthentificationService';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatTooltipModule, MatListModule, MatSidenavModule, MatToolbarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit
{
    protected mdcBackdrop = signal<BooleanInput>(false);
    protected drawerMode = signal<MatDrawerMode>("push");
    
    private dialog = inject(MatDialog);
    private location = inject(Location);
    private router = inject(Router);
    private authServ = inject(AuthentificationService);

    protected estConnecter = computed(() => this.authServ.estConnecter());

    constructor(private breakpointObserver: BreakpointObserver) 
    {
        let breakpoint$ = this.breakpointObserver
        .observe([ '(max-width: 500px)']);

        breakpoint$.subscribe(() =>
        this.BreakpointChanges()
        );
    }

    ngAfterViewInit(): void 
    {
        // reconnexion automatique 
        if(sessionStorage.getItem("utilisateur"))
        {
            environment.utilisateur = JSON.parse(sessionStorage.getItem("utilisateur")!);

            const EXP = +JSON.parse(atob(environment.utilisateur.jwt.split(".")[1]))["exp"];            

            // JWT expiré
            if(new Date(EXP * 1_000).getTime() < new Date().getTime())
            {
                sessionStorage.clear();
                environment.utilisateur = null;
                this.authServ.estConnecter.set(false);
                return;
            }

            // la page précédente est l'application
            if(document.referrer && document.referrer.includes(environment.urlFront))
            {
                this.authServ.estConnecter.set(true);
                this.location.back();
            }
        }
    }

    protected Deconnexion(): void
    {
        this.authServ.estConnecter.set(false);
        sessionStorage.removeItem("utilisateur");
        environment.utilisateur = null;
        this.router.navigateByUrl("/");
    }

    protected OuvrirModalPanier(): void
    {
        this.dialog.open(ModalPanier, {
            width: "50%", 
            maxWidth: "100vw",
        });
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
