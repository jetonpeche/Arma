import { Component, inject, signal } from '@angular/core';
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
import { Materiel } from '@models/Materiel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatTooltipModule, MatListModule, MatSidenavModule, MatToolbarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App 
{
    protected mdcBackdrop = signal<BooleanInput>(false);
    protected drawerMode = signal<MatDrawerMode>("push");

    private dialog = inject(MatDialog);

    constructor(private breakpointObserver: BreakpointObserver) 
    {
        let breakpoint$ = this.breakpointObserver
        .observe([ '(max-width: 500px)']);

        breakpoint$.subscribe(() =>
        this.BreakpointChanges()
        );
    }

    EstConnecter()
    {
        return true;
    }

    Deconnexion()
    {

    }

    OuvrirModalPanier(): void
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
