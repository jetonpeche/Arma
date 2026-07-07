import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { Specialite } from '@models/Specialite';
import { MatSelectModule } from '@angular/material/select';
import { AuthentificationService } from '@services/AuthentificationService';
import { SpecialiteService } from '@services/SpecialiteService';
import { ReactiveFormsModule } from '@angular/forms';

interface SpecialiteNode extends Specialite {
    enfants: SpecialiteNode[];
}

@Component({
  selector: 'app-specialite',
  imports: [UpperCasePipe, MatCardModule, ReactiveFormsModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, NgTemplateOutlet, MatTabsModule],
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
    private specialiteServ = inject(SpecialiteService);
    private authServ = inject(AuthentificationService);
    private router = inject(Router);

private DONNEES_TEST_SPECIALITES: Specialite[] = [
    {
        id: 1,
        idParents: [], // RACINE
        nom: "Infanterie Standard",
        raccourci: "INF",
        grade: { id: 1, nom: "Private", nbOperationRequis: 0 },
        description: "Unité terrestre de base. Formation généralisée au combat et sécurisation d'objectifs.",
        estNavy: false,
        categorie: "Combat Terrestre",
        urlImage: "https://via.placeholder.com/320x140/2b3a26/4B6344?text=INFANTERIE"
    },
    {
        id: 2,
        idParents: [1], // ENFANT 1
        nom: "Opérateur Anti-Tank",
        raccourci: "AT",
        grade: { id: 2, nom: "Corporal", nbOperationRequis: 5 },
        description: "Équipé du lance-roquettes SPNKr M41. Neutralise les blindés lourds et les tourelles antiaériennes avec précision.",
        estNavy: false,
        categorie: "Combat Terrestre",
        urlImage: "https://via.placeholder.com/320x140/2b3a26/4B6344?text=ANTI-TANK"
    },
    {
        id: 3,
        idParents: [1], // ENFANT 2
        nom: "Opérateur Radio",
        raccourci: "RDO",
        grade: { id: 2, nom: "Corporal", nbOperationRequis: 5 },
        description: "Gestion des communications cryptées, coordination avec le QG et demande de frappes orbitales ciblées (MAC).",
        estNavy: false,
        categorie: "Combat Terrestre",
        urlImage: "https://via.placeholder.com/320x140/2b3a26/4B6344?text=RADIO"
    },
    {
        id: 4,
        idParents: [1], // ENFANT 3 (NOUVEAU)
        nom: "Médecin de terrain",
        raccourci: "MED",
        grade: { id: 2, nom: "Corporal", nbOperationRequis: 5 },
        description: "Opérateur équipé de bio-mousse et de défibrillateurs tactiques. Maintient l'escouade en vie sous le feu nourri.",
        estNavy: false,
        categorie: "Combat Terrestre",
        urlImage: "https://via.placeholder.com/320x140/2b3a26/4B6344?text=MEDECIN"
    },
    {
        id: 5,
        idParents: [1], // ENFANT 4 (NOUVEAU)
        nom: "Ingénieur de combat",
        raccourci: "ING",
        grade: { id: 2, nom: "Corporal", nbOperationRequis: 5 },
        description: "Spécialiste des explosifs C-12, du déminage et de la réparation de véhicules endommagés sur le champ de bataille.",
        estNavy: false,
        categorie: "Combat Terrestre",
        urlImage: "https://via.placeholder.com/320x140/2b3a26/4B6344?text=INGENIEUR"
    },

    {
        id: 6,
        idParents: [], // RACINE
        nom: "Tank tank Standard",
        raccourci: "AT",
        grade: { id: 1, nom: "E8-Senior chief hospital corpsman", nbOperationRequis: 0 },
        description: "Unité terrestre de base. Formation généralisée au combat et sécurisation d'objectifs.",
        estNavy: false,
        categorie: "Combat Terrestre",
        urlImage: "https://via.placeholder.com/320x140/2b3a26/4B6344?text=INFANTERIE"
    },
    {
        id: 7,
        idParents: [6], // ENFANT 4 (NOUVEAU)
        nom: "Ingénieur de combat",
        raccourci: "ING",
        grade: { id: 2, nom: "Private first class", nbOperationRequis: 5 },
        description: "Spécialiste des explosifs C-12, du déminage et de la réparation de véhicules endommagés sur le champ de bataille.",
        estNavy: false,
        categorie: "Combat Terrestre",
        urlImage: "https://via.placeholder.com/320x140/2b3a26/4B6344?text=INGENIEUR"
    },
    {
        id: 8,
        idParents: [6], // ENFANT 4 (NOUVEAU)
        nom: "Ingénieur de combat",
        raccourci: "ING",
        grade: { id: 2, nom: "Corporal", nbOperationRequis: 5 },
        description: "Spécialiste des explosifs C-12, du déminage et de la réparation de véhicules endommagés sur le champ de bataille.",
        estNavy: false,
        categorie: "Combat Terrestre",
        urlImage: "https://via.placeholder.com/320x140/2b3a26/4B6344?text=INGENIEUR"
    },
];

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
        if (VALEUR_CAT) {
            fullTree = fullTree.filter(racine => racine.categorie === VALEUR_CAT);
        }

        // 2. FILTRE PAR TEXTE
        if (VALEUR_TEXTE) {
            const filterTree = (nodes: SpecialiteNode[]): SpecialiteNode[] => {
                return nodes.reduce((acc, node) => {
                    const match = node.nom.toLowerCase().includes(VALEUR_TEXTE) || node.raccourci.toLowerCase().includes(VALEUR_TEXTE);
                    const enfantsFiltres = filterTree(node.enfants);
                    
                    if (match || enfantsFiltres.length > 0) {
                        acc.push({ ...node, enfants: enfantsFiltres });
                    }
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

    protected GestionSpecialite(): void
    {
        this.router.navigateByUrl("/gestion-specialite");
    }

    private Lister(): void
    {
                        this.listeSpecialiteClone.set(this.DONNEES_TEST_SPECIALITES);
                    const categoriesUniques = [
                    ...new Set(
                        this.DONNEES_TEST_SPECIALITES
                            .filter(x => (!x.idParents || x.idParents.length === 0) && x.categorie)
                            .map(x => x.categorie as string)
                    )
                ].sort();
                
                this.listeCategories.set(categoriesUniques);

                const arbreComplet = this.ConstruireArbre(this.DONNEES_TEST_SPECIALITES);
                this.DiviserEtMettreAJourArbres(arbreComplet);

        // this.specialiteServ.Lister().subscribe({
        //     next: (retour) => 
        //     {
        //         this.listeSpecialiteClone.set(retour);
                
        //         const categoriesUniques = [
        //             ...new Set(
        //                 retour
        //                     .filter(x => (!x.idParents || x.idParents.length === 0) && x.categorie)
        //                     .map(x => x.categorie as string)
        //             )
        //         ].sort();
                
        //         this.listeCategories.set(categoriesUniques);

        //         const arbreComplet = this.ConstruireArbre(retour);
        //         this.DiviserEtMettreAJourArbres(arbreComplet);
        //     }
        // });
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