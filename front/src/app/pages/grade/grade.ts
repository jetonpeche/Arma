import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { Grade } from '@models/Grade';
import { AuthentificationService } from '@services/AuthentificationService';
import { GradeService } from '@services/GradeService';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-grade',
  imports: [MatTabsModule, MatIconModule, MatButtonModule, MatCardModule, MatDividerModule, NgTemplateOutlet],
  templateUrl: './grade.html',
  styleUrl: './grade.scss',
})
export class GradePage 
{
    protected droit: Droit;
    protected listeGrade = signal<Grade[]>([]);
    private listeGradeClone = signal<Grade[]>([]);

    private router = inject(Router);
    private gradeServ = inject(GradeService);
    private authServ = inject(AuthentificationService);
    
    ngOnInit(): void
    {
        this.droit = this.authServ.RecupererDroit(EUrl.Grade);
        this.Lister();
    }

    Filtrer(_event: MatTabChangeEvent)
    {
        const I = _event.index == 0 ? 2 : 1;
        this.listeGrade.set(this.listeGradeClone().filter(x =>  x.conserne == I));
    }

    protected GestionGrade(): void
    {
        this.router.navigateByUrl("/gestion-grade");
    }

    private  Lister(): void
    {
        this.gradeServ.Lister().subscribe({
            next: (retour) =>
            {   
                this.listeGradeClone.set(retour.sort((a, b) => a.ordre - b.ordre));
                this.listeGrade.set(this.listeGradeClone().filter(x => x.conserne == 2));
            }
        });
    }
}
