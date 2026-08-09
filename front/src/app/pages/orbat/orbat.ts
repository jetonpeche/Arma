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
import { Droit } from '@models/DroitGroupe';
import { AuthentificationService } from '@services/AuthentificationService';
import { EUrl } from '@enums/EUrl';
import { DialogConfirmationService } from '@services/DialogConfirmationService';

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

    protected droit: Droit;
    protected droitModifierFichier: Droit;

    protected recherche = signal<string>("");
    
    // Le sommet de l'arbre
    protected racineOrbat = signal<OrbatNode[]>([]);
    protected isDragging = signal(false);

    // Variables pour le cliquer-glisser (Drag & Pan)
    private startX = 0;
    private startY = 0;
    private scrollLeft = 0;
    private scrollTop = 0;

    private orbatServ = inject(OrbatService);
    private fichierServ = inject(FichierService);
    private snackBarServ = inject(SnackBarService);
    private authServ = inject(AuthentificationService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private dialog = inject(MatDialog);

    private readonly estMobile = window.innerWidth <= 800;

    protected arbreFiltre = computed(() => {
        const terme = this.recherche().toLowerCase().trim();
        const racines = this.racineOrbat();

        if (!racines || racines.length == 0) 
            return [];

        if (!terme) 
            return racines;

        const resultats: OrbatNode[] = [];

        // Fonction récursive de recherche
        const chercher = (noeud: OrbatNode) => {
            const match = 
                noeud.titre.toLowerCase().includes(terme) ||
                (noeud.indicatif && noeud.indicatif.toLowerCase().includes(terme)) ||
                noeud.listeSlot.some(s => s.personnage && s.personnage.nom.toLowerCase().includes(terme));

            if (match)
                resultats.push({ ...noeud, enfants: [] });

            if (noeud.enfants && noeud.enfants.length > 0)
                noeud.enfants.forEach(e => chercher(e));
        };

        racines.forEach(racine => chercher(racine));
        
        return resultats;
    });

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.Orbat);
        this.droitModifierFichier = this.authServ.RecupererDroit(EUrl.UploadFichier);
        this.ListerOrbat();
    }

    protected OuvrirModalConfirmation(_idOrbat: number): void
    {
        this.dialogConfirmationServ.Ouvrir("Suppression d'un élement", "Confirmez-vous la suppression de cet element de l'orbat ?").subscribe({
            next: (retour) => 
            {
                if(retour)
                    this.Supprimer(_idOrbat);
            }
        })
    }

    protected OuvrirModalAjouterModifierOrbat(_orbat?: Orbat, _idParent?: number): void
    {
        if(!_orbat && _idParent)
        {   
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

                // MISE À JOUR : On applique la modification à toutes les racines de l'orbat
                this.racineOrbat.update(racines => racines.map(r => MettreAJourNoeud(r)));
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

    private ConstruireArbre(listePlate: Orbat[]): OrbatNode[] 
    {
        if (!listePlate || listePlate.length == 0) 
            return [];

        const mapNoeuds = new Map<number, OrbatNode>();
        
        listePlate.forEach(item => {
            mapNoeuds.set(item.id, { ...item, enfants: [] });
        });

        const racines: OrbatNode[] = [];

        mapNoeuds.forEach(noeud => {
            if (noeud.idParent) 
            {
                const parent = mapNoeuds.get(noeud.idParent);

                if (parent && parent.enfants)
                    parent.enfants.push(noeud);
            }
            else 
                racines.push(noeud);
        });

        return racines;
    }

    private ListerOrbat(): void
    {
        this.orbatServ.Lister().subscribe({
            next: (retour) => 
            {
                const arbresHiérarchiques = this.ConstruireArbre(retour);
                this.racineOrbat.set(arbresHiérarchiques);
            }
        });
    }

    private Supprimer(_idOrbat: number): void
    {
        this.orbatServ.Supprimer(_idOrbat).subscribe({
            next: () =>
            {
                this.ListerOrbat();
            }
        })
    }
}
