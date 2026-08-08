import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { Grade } from '@models/Grade';
import { Orbat } from '@models/Orbat';
import { Personnage } from '@models/Personnage';
import { GradeService } from '@services/GradeService';
import { OrbatService } from '@services/OrbatService';
import { PersonnageService } from '@services/PersonnageService';
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatAnchor, MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from '@angular/material/tooltip';
import { FichierService } from '@services/FichierService';
import { ETypeRessource } from '@enums/ETypeRessource';
import { SnackBarService } from '@services/SnackBarService';
import { InputFile } from "@jetonpeche/angular-mat-input";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierOrbat } from '@modals/ajouter-modifier-orbat/ajouter-modifier-orbat';

export interface OrbatNode extends Orbat {
  enfants?: OrbatNode[];
} 

@Component({
  selector: 'app-orbat',
  imports: [MatTooltipModule, FormsModule, MatFormFieldModule, MatInputModule, MatTooltipModule, MatButtonModule, MatIconModule, NgTemplateOutlet, UpperCasePipe, MatIcon, MatAnchor, InputFile],
  templateUrl: './orbat.html',
  styleUrl: './orbat.scss',
})
export class OrbatPage implements OnInit
{
    viewport = viewChild.required<ElementRef>("viewport");

    protected listePersonnage = signal<Personnage[]>([]);

    protected recherche = signal<string>("");
    
    // Le sommet de l'arbre
    protected racineOrbat = signal<OrbatNode | null>(null);
    protected isDragging = signal(false);

    // Variables pour le cliquer-glisser (Drag & Pan)
    private startX = 0;
    private startY = 0;
    private scrollLeft = 0;
    private scrollTop = 0;

    private orbatServ = inject(OrbatService);
    private fichierServ = inject(FichierService);
    private snackBarServ = inject(SnackBarService);
    private dialog = inject(MatDialog);

    private readonly estMobile = window.innerWidth <= 800;

    protected arbreFiltre = computed(() => {
        const terme = this.recherche().toLowerCase().trim();
        const racine = this.racineOrbat();

        if (!racine) 
            return [];

        if (!terme) 
            return [racine];

        const resultats: OrbatNode[] = [];

        // Fonction récursive de recherche
        const chercher = (noeud: OrbatNode) => {
            
            const match = 
                noeud.titre.toLowerCase().includes(terme) ||
                (noeud.indicatif && noeud.indicatif.toLowerCase().includes(terme)) ||
                noeud.listeSlot.some(s => s.personnage && s.personnage.nom.toLowerCase().includes(terme));

                if (match)
                    resultats.push({ ...noeud, enfants: [] });

                // On continue de fouiller dans les sous-unités
                if (noeud.enfants && noeud.enfants.length > 0) {
                    noeud.enfants.forEach(e => chercher(e));
                }
            };

        chercher(racine);
        return resultats;
    });

    ngOnInit(): void 
    {
        this.ListerOrbat();
    }

    protected OuvrirModalAjouterModifierOrbat(_orbat?: Orbat, _idParent?: number): void
    {
        if(!_orbat && _idParent)
        {
            console.log("ok");
            
            _orbat = {
                id: null,
                indicatif: null,
                frequenceRadio: null,
                titre: null,
                listeSlot: null,
                urlImage: null,
                idParent: _idParent
            };
        }

        const DIALOG_REF = this.dialog.open(AjouterModifierOrbat, {
            width: this.estMobile ? "95%" : "70%", 
            maxWidth: "100vw",
            data: _orbat
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) => 
            {
                if(retour === true)
                    this.ListerOrbat();
            }
        });
    }

    protected UploadFichier(_idOrbat: number, _fichier: File): void
    {
        this.fichierServ.Upload(_idOrbat, ETypeRessource.Orbat, _fichier).subscribe({
            next: (url: string) => 
            {
                this.snackBarServ.Ok("Le fichier a été uploadé");
                
                const MettreAJourNoeud = (noeud: OrbatNode): OrbatNode => 
                {
                    if (noeud.id == _idOrbat)
                        return { ...noeud, urlImage: `${url}?t=${new Date().getTime()}` };
                    
                    if (noeud.enfants && noeud.enfants.length > 0)
                        return { ...noeud, enfants: noeud.enfants.map(enfant => MettreAJourNoeud(enfant)) };
                    
                    return noeud;
                };

                this.racineOrbat.update(racine => racine ? MettreAJourNoeud(racine) : null);
            }
        });
    }

    protected onMouseDown(event: MouseEvent | TouchEvent): void 
    {
        this.isDragging.set(true);
        
        const clientX = event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;
        const clientY = event instanceof MouseEvent ? event.pageY : event.touches[0].pageY;

        this.startX = clientX - this.viewport().nativeElement.offsetLeft;
        this.startY = clientY - this.viewport().nativeElement.offsetTop;
        this.scrollLeft = this.viewport().nativeElement.scrollLeft;
        this.scrollTop = this.viewport().nativeElement.scrollTop;
    }

    protected onMouseLeave(): void 
    {
        this.isDragging.set(false);
    }

    protected onMouseUp(): void 
    {
        this.isDragging.set(false);
    }

    protected onMouseMove(event: MouseEvent | TouchEvent): void 
    {
        if (!this.isDragging())
            return;

        event.preventDefault();
        
        const clientX = event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;
        const clientY = event instanceof MouseEvent ? event.pageY : event.touches[0].pageY;

        const x = clientX - this.viewport().nativeElement.offsetLeft;
        const y = clientY - this.viewport().nativeElement.offsetTop;
        const walkX = (x - this.startX) * 1.5; // Vitesse de déplacement
        const walkY = (y - this.startY) * 1.5;
        
        this.viewport().nativeElement.scrollLeft = this.scrollLeft - walkX;
        this.viewport().nativeElement.scrollTop = this.scrollTop - walkY;
    }

  private ListerOrbat(): void
  {
    // Simulation d'une arborescence pour tester l'interface
    const fausseDonnee: OrbatNode = {
        id: 1,
        idParent: null,
        titre: "Battle Group Hyperion",
        indicatif: "BGH",
        frequenceRadio: "110",
        urlImage: "assets/img/logo-88th.png", // Mettez une image factice ici
        listeSlot: [
            { id: 1, role: "Battlegroup Commander", ordreAffichage: 1, estOptionnel: false, gradeRequis: null, personnage: { id: 1, nom: "COM W.Keaton" } }
        ],
        enfants: [
            {
                id: 2,
                idParent: 1,
                titre: "Company-21 Command Squad",
                indicatif: "Aquila 0-1",
                frequenceRadio: "111",
                urlImage: "",
                listeSlot: [
                    { id: 2, role: "Company Commander", ordreAffichage: 1, estOptionnel: false, gradeRequis: null, personnage: { id: 2, nom: "CPT L.Stone" } },
                    { id: 3, role: "Company Log-chief", ordreAffichage: 2, estOptionnel: false, gradeRequis: null, personnage: { id: 3, nom: "GYSGT Coburn" } }
                ],
                enfants: [
                    {
                        id: 3,
                        idParent: 2,
                        titre: "Squad-1",
                        indicatif: "Orion 1-1",
                        frequenceRadio: "112",
                        urlImage: "",
                        listeSlot: [
                            { id: 4, role: "Squad Leader", ordreAffichage: 1, estOptionnel: false, gradeRequis: null, personnage: { id: 4, nom: "SGT J.Davis" } },
                            { id: 5, role: "Medic", ordreAffichage: 2, estOptionnel: false, gradeRequis: null, personnage: null }
                        ]
                    },
                    {
                        id: 4,
                        idParent: 2,
                        titre: "Armored Platoon",
                        indicatif: "Scorpius 4-1",
                        frequenceRadio: "115",
                        urlImage: "",
                        listeSlot: [
                            { id: 6, role: "Chef Blindé", ordreAffichage: 1, estOptionnel: false, gradeRequis: null, personnage: { id: 5, nom: "SGT N.Watt" } },
                            { id: 7, role: "Crew", ordreAffichage: 2, estOptionnel: true, gradeRequis: null, personnage: null },
                            { id: 8, role: "Crew", ordreAffichage: 3, estOptionnel: true, gradeRequis: null, personnage: null }
                        ]
                    }
                ]
            }
        ]
    };

    this.racineOrbat.set(fausseDonnee);
  }
}
