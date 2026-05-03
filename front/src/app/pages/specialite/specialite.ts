import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { Specialite } from '@models/Specialite';
import { AuthentificationService } from '@services/AuthentificationService';
import { SpecialiteService } from '@services/SpecialiteService';

@Component({
  selector: 'app-specialite',
  imports: [MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './specialite.html',
  styleUrl: './specialite.scss',
})
export class SpecialitePage implements OnInit
{
    protected listeSpecialite = signal<Specialite[]>([]);
    protected droit: Droit;

    private specialiteServ = inject(SpecialiteService);
    private authServ = inject(AuthentificationService);
    private router = inject(Router);

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.Specialite);
        this.Lister();
    }

    protected GestionSpecialite(): void
    {
        this.router.navigateByUrl("/gestion-specialite");
    }

    private Lister(): void
    {
        this.specialiteServ.Lister().subscribe({
            next: (retour) => 
            {
                this.listeSpecialite.set(retour);
            }
        });
    }
}
