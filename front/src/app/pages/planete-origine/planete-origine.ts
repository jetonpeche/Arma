import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { PlaneteOrigine } from '@models/PlaneteOrigine';
import { AuthentificationService } from '@services/AuthentificationService';
import { PlaneteService } from '@services/PlaneteService';

@Component({
  selector: 'app-planete-origine',
  imports: [MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule, MatButtonModule],
  templateUrl: './planete-origine.html',
  styleUrl: './planete-origine.scss',
})
export class PlaneteOriginePage implements OnInit 
{
    protected listePlanete = signal<PlaneteOrigine[]>([]);
    protected droit: Droit;

    private listePlaneteClone = signal<PlaneteOrigine[]>([]);
    private router = inject(Router);
    private planeteServ = inject(PlaneteService);
    private authServ = inject(AuthentificationService);

    ngOnInit(): void 
    {
        this.Lister();
        this.droit = this.authServ.RecupererDroit(EUrl.PlaneteOrigine);
    }

    protected Recherche(_valeur: string): void
    {
        const VALEUR = _valeur.toLowerCase().trim();

        this.listePlanete.set(this.listePlaneteClone().filter(x => x.nom.toLowerCase().includes(VALEUR || "")));
    }

    protected GestionPlanete(): void
    {
        this.router.navigateByUrl("/gestion-planete-origine");
    }

    private Lister(): void
    {
        this.planeteServ.Lister().subscribe({
            next: (retour) => {
                this.listePlanete.set(retour);
                this.listePlaneteClone.set(retour);
            }
        });
    }
}
