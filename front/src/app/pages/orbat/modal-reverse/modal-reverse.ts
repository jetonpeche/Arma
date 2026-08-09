import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PersonnageService } from '@services/PersonnageService';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PersonnageReserve } from '@models/PersonnageReserve';
import { MatDatepickerModule } from '@angular/material/datepicker';

interface GroupeTroupe {
    specialite: string;
    troupes: PersonnageReserve[];
}

@Component({
  selector: 'app-modal-reverse',
    imports: [
        MatDialogModule, MatIconModule, MatButtonModule, 
        MatFormFieldModule, MatInputModule, FormsModule, 
        MatButtonToggleModule, UpperCasePipe, MatTooltipModule,
        MatDatepickerModule, DatePipe
    ],
  templateUrl: './modal-reverse.html',
  styleUrl: './modal-reverse.scss',
})
export class ModalReverse implements OnInit
{
    protected troupesDisponibles = signal<PersonnageReserve[]>([]);
    protected recherche = signal<string>('');
    protected filtreDate = signal<Date | null>(null);
    protected modeGroupe = signal<boolean>(false); // false = Liste Globale, true = Tri par spé

    private personnageServ = inject(PersonnageService);

    protected troupesFiltrees = computed(() => {
        const terme = this.recherche().toLowerCase().trim();
        const dateLimite = this.filtreDate();
        const liste = this.troupesDisponibles();
        
        return liste.filter(t => {
            // A. Vérification de la recherche textuelle
            const matchTexte = !terme || 
                t.nom.toLowerCase().includes(terme) || 
                (t.nomSpecialite && t.nomSpecialite.toLowerCase().includes(terme)) ||
                (t.grade.nomRaccourci && t.grade.nomRaccourci.toLowerCase().includes(terme));

            // B. Vérification de l'inactivité (Dernière op <= date limite)
            let matchDate = true;
            if (dateLimite) 
            {
                if (!t.dateDerniereParticipation) 
                {
                    matchDate = true;
                } 
                else 
                {
                    const dateOp = new Date(t.dateDerniereParticipation);
                    matchDate = dateOp <= dateLimite;
                }
            }

            return matchTexte && matchDate;
        });
    });

    protected statistiques = computed(() => {
        const liste = this.troupesFiltrees();
        const stats: Record<string, number> = {};
        
        for (const element of liste) 
        {
            const spec = element.nomSpecialite || 'N/A';
            stats[spec] = (stats[spec] || 0) + 1;
        }
        
        return {
            total: liste.length,
            details: stats
        };
    });

    protected groupesAffichage = computed<GroupeTroupe[]>(() => 
    {
        const liste = this.troupesFiltrees();
        
        if (!this.modeGroupe())
            return [{ specialite: 'Effectifs Globaux', troupes: liste }];

        const groupesMap = new Map<string, PersonnageReserve[]>();
        liste.forEach(t => {
            const spec = t.nomSpecialite || 'Infanterie standard';
            if (!groupesMap.has(spec)) {
                groupesMap.set(spec, []);
            }
            groupesMap.get(spec)!.push(t);
        });

        const result: GroupeTroupe[] = [];
        groupesMap.forEach((troupes, specialite) => {
            result.push({ specialite, troupes });
        });

        return result.sort((a, b) => a.specialite.localeCompare(b.specialite));
    });

    ngOnInit(): void 
    {
        this.personnageServ.ListerReserve().subscribe({
            next: (data) => this.troupesDisponibles.set(data)
        });
    }
}
