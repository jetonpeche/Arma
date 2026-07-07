import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { Specialite } from '@models/Specialite';
import { MatSelectModule } from '@angular/material/select';
import { AuthentificationService } from '@services/AuthentificationService';
import { SpecialiteService } from '@services/SpecialiteService';
import { ReactiveFormsModule } from '@angular/forms';
import { InputFile } from "@jetonpeche/angular-mat-input";
import { ETypeRessource } from '@enums/ETypeRessource';
import { FichierService } from '@services/FichierService';
import { SnackBarService } from '@services/SnackBarService';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierSpecialite } from '@modals/ajouter-modifier-specialite/ajouter-modifier-specialite';

interface SpecialiteNode extends Specialite {
    enfants: SpecialiteNode[];
}

@Component({
  selector: 'app-specialite',
  imports: [UpperCasePipe, MatTooltipModule, MatCardModule, ReactiveFormsModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, NgTemplateOutlet, MatTabsModule, InputFile],
  templateUrl: './specialite.html',
  styleUrl: './specialite.scss',
})
export class SpecialitePage implements OnInit
{
    protected arbreMarines = signal<SpecialiteNode[]>([]);
    protected arbreNavy = signal<SpecialiteNode[]>([]);
    protected listeCategories = signal<string[]>([]);
    protected categorieFiltre = signal<string>('');
    protected texteRecherche = signal<string>('');
    protected droit: Droit | null;

    private listeSpecialiteClone = signal<Specialite[]>([]);
    private dialog = inject(MatDialog);
    private specialiteServ = inject(SpecialiteService);
    private authServ = inject(AuthentificationService);
    private fichierServ = inject(FichierService);
    private snackBarServ = inject(SnackBarService);
    private dialogServ = inject(DialogConfirmationService);

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.Specialite);
        this.Lister();
    }

    protected Recherche(_valeur: string): void
    {
        const VALEUR = _valeur.toLowerCase().trim();
        const fullTree = this.ConstruireArbre(this.listeSpecialiteClone());

        if (!VALEUR) 
        {
            this.DiviserEtMettreAJourArbres(fullTree);
            return;
        }

        // Algorithme de filtrage : garde un parent si lui OU un de ses enfants correspond
        const filterTree = (nodes: SpecialiteNode[]): SpecialiteNode[] => 
        {
            return nodes.reduce((acc, node) => 
            {
                const match = node.nom.toLowerCase().includes(VALEUR) || node.raccourci.toLowerCase().includes(VALEUR);
                const enfantsFiltres = filterTree(node.enfants);
                
                if (match || enfantsFiltres.length > 0)
                    acc.push({ ...node, enfants: enfantsFiltres });
                
                return acc;
            }, [] as SpecialiteNode[]);
        };

        this.DiviserEtMettreAJourArbres(filterTree(fullTree));
    }

    protected AppliquerFiltres(): void
    {
        const VALEUR_TEXTE = this.texteRecherche().toLowerCase().trim();
        const VALEUR_CAT = this.categorieFiltre();

        let fullTree = this.ConstruireArbre(this.listeSpecialiteClone());

        // 1. FILTRE PAR BRANCHE (Catégorie)
        // Si l'officier a choisi une catégorie, on élimine les racines qui ne correspondent pas.
        if (VALEUR_CAT)
            fullTree = fullTree.filter(racine => racine.categorie === VALEUR_CAT);

        // 2. FILTRE PAR TEXTE
        if (VALEUR_TEXTE) 
        {
            const filterTree = (nodes: SpecialiteNode[]): SpecialiteNode[] => 
            {
                return nodes.reduce((acc, node) => {
                    const match = node.nom.toLowerCase().includes(VALEUR_TEXTE) || node.raccourci.toLowerCase().includes(VALEUR_TEXTE);
                    const enfantsFiltres = filterTree(node.enfants);
                    
                    if (match || enfantsFiltres.length > 0)
                        acc.push({ ...node, enfants: enfantsFiltres });
                    
                    return acc;
                }, [] as SpecialiteNode[]);
            };
            fullTree = filterTree(fullTree);
        }

        // Mise à jour de l'affichage
        this.DiviserEtMettreAJourArbres(fullTree);
    }

    protected ChangerRechercheTexte(event: any): void 
    {
        this.texteRecherche.set(event.target.value);
        this.AppliquerFiltres();
    }

    protected ChangerCategorie(cat: string): void 
    {
        this.categorieFiltre.set(cat);
        this.AppliquerFiltres();
    }

    protected UploadFichier(_idSpecialite: number, _fichier: File): void
    {
        this.fichierServ.Upload(_idSpecialite, ETypeRessource.Specialite, _fichier).subscribe({
            next: (url: string) => 
            {
                this.snackBarServ.Ok("Le fichier a été uploadé");
                this.listeSpecialiteClone.update(x => 
                {
                    return x.map(p => 
                    {
                        if (p.id == _idSpecialite)
                            return { ...p, urlImage: `${url}?t=${new Date().getTime()}` }
                        
                        return p;
                    });
                });
            }
        });
    }

    protected OuvrirModalAjouterModifier(_mode: "ajouter" | "modifier" | "nouveau", _specialite?: Specialite): void
    {
        const listeFiltree = _specialite 
            ? this.listeSpecialiteClone().filter(x => x.estNavy === _specialite.estNavy)
            : this.listeSpecialiteClone();

        const info = {
            mode: _mode,
            specialite: _mode === "modifier" ? _specialite : null,
            idParent: _mode === "ajouter" ? _specialite?.id : null,
            estNavy: _specialite ? _specialite.estNavy : null,
            // C'est une racine si c'est un "nouveau" OU si on "modifie" un noeud qui n'a pas de parents
            estCategorieParentClicker: _mode === "nouveau" || (_mode === "modifier" && _specialite?.idParents?.length === 0),
            listeSpecialite: listeFiltree
        };

        const DIALOG_REF = this.dialog.open(AjouterModifierSpecialite, {
            width: "50%",
            maxWidth: "100vw",
            data: info
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) => {
                if(retour === true) this.Lister();
            }
        });
    }

    protected OuvrirModalConfirmationSupprimer(nodeASupprimer: SpecialiteNode): void 
    {
        const MESSAGE = `PROTOCOLE DE SUPPRESSION : Êtes-vous sûr de vouloir effacer la spécialité [${nodeASupprimer.raccourci}] ${nodeASupprimer.nom} ?`
        this.dialogServ.Ouvrir("Supprimer spécialité", MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(nodeASupprimer);
            }
        });   
    }

    private Lister(): void
    {
        this.specialiteServ.Lister().subscribe({
            next: (retour) => 
            {
                this.listeSpecialiteClone.set(retour);
                    const categoriesUniques = [
                    ...new Set(
                        retour
                            .filter(x => (!x.idParents || x.idParents.length === 0) && x.categorie)
                            .map(x => x.categorie as string)
                    )
                ].sort();
                
                this.listeCategories.set(categoriesUniques);

                const arbreComplet = this.ConstruireArbre(retour);
                this.DiviserEtMettreAJourArbres(arbreComplet);
            }
        });
    }

    private Supprimer(_nodeASupprimer: SpecialiteNode): void
    {
        this.specialiteServ.Supprimer(_nodeASupprimer.id).subscribe({
            next: () => 
            {
                this.MettreAJourBlocsImpactes(_nodeASupprimer.id, _nodeASupprimer.idParents);
            }
        });
    }

    private MettreAJourBlocsImpactes(idParentSupprime: number, nouveauxIdsParents: number[]): void
    {
        let listeActuelle = this.listeSpecialiteClone();

        // On balaie la liste locale pour mettre à jour les enfants qui contenaient le parent supprimé
        listeActuelle = listeActuelle.map(specialite => 
        {
            if (specialite.idParents && specialite.idParents.includes(idParentSupprime)) 
            {
                // On lui retire le parent supprimé
                let parentsNettoyes = specialite.idParents.filter(id => id !== idParentSupprime);

                // On lui injecte ses nouveaux parents supérieurs (grands-parents)
                parentsNettoyes = [...new Set([...parentsNettoyes, ...nouveauxIdsParents])];
                
                return { ...specialite, idParents: parentsNettoyes };
            }

            return specialite;
        });

        // On retire définitivement le bloc supprimé de la mémoire locale
        listeActuelle = listeActuelle.filter(x => x.id !== idParentSupprime);

        // On met à jour le Signal central et on rafraîchit l'arbre graphique
        this.listeSpecialiteClone.set(listeActuelle);
        this.AppliquerFiltres();
    }

    // Transforme la liste plate en arbre ET calcule la profondeur
    private ConstruireArbre(flatList: Specialite[]): SpecialiteNode[] 
    {
        const map = new Map<number, SpecialiteNode>();
        const racines: SpecialiteNode[] = [];

        // 1. On prépare tous les noeuds avec un tableau d'enfants vide
        flatList.forEach(item => {
            map.set(item.id, { ...item, enfants: [] });
        });

        // 2. On connecte chaque noeud à TOUS ses parents !
        flatList.forEach(item => {
            const node = map.get(item.id)!;
            
            // Si le noeud a des parents, on l'ajoute dans le dossier de CHACUN de ses parents
            if (item.idParents && item.idParents.length > 0) 
            {
                item.idParents.forEach(parentId => {
                    const parent = map.get(parentId);

                    if (parent)
                        parent.enfants.push(node);
                });
            } 
            // c'est une racine
            else
                racines.push(node);
        });

        return racines;
    }

    private DiviserEtMettreAJourArbres(arbreComplet: SpecialiteNode[]): void 
    {
        this.arbreNavy.set(arbreComplet.filter(x => x.estNavy));
        this.arbreMarines.set(arbreComplet.filter(x => !x.estNavy));
    }
}