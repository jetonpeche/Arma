import { Routes } from '@angular/router';

export const routes: Routes = [
    { 
        path: "personnage",
        loadComponent: () => import("./pages/personnage/personnagePage").then(x => x.PersonnagePage),
        title: "Personnage"
    },
    { 
        path: "grade",
        loadComponent: () => import("./pages/grade/grade-page").then(x => x.GradePage),
        title: "Grade"
    },
    { 
        path: "planete-origine",
        loadComponent: () => import("./pages/planete-origine/planete-origine").then(x => x.PlaneteOriginePage),
        title: "Planète d'origine"
    },
    { 
        path: "specialiste",
        loadComponent: () => import("./pages/specialite/specialite").then(x => x.SpecialitePage),
        title: "Specialiste"
    },
    { 
        path: "boutique",
        loadComponent: () => import("./pages/boutique/boutique").then(x => x.BoutiquePage),
        title: "Boutique"
    },
    { 
        path: "gestion-boutique",
        loadComponent: () => import("./pages/gestion-boutique/gestion-boutique").then(x => x.GestionBoutiquePage),
        title: "Gestion de la boutique"
    },
    { 
        path: "logistique",
        loadComponent: () => import("./pages/logistique/logistique").then(x => x.LogistiquePage),
        title: "Logistique"
    },
    { 
        path: "materiel",
        loadComponent: () => import("./pages/materiel/materiel").then(x => x.MaterielPage),
        title: "Matériel"
    },
    { 
        path: "vaisseau",
        loadComponent: () => import("./pages/vaisseau/vaisseau").then(x => x.VaisseauPage),
        title: "Vaisseau"
    },
    { 
        path: "proposition-achat",
        loadComponent: () => import("./pages/proposition-achat/proposition-achat").then(x => x.PropositionAchatPage),
        title: "Proposition d'achat"
    }
];
