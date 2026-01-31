import { Routes } from '@angular/router';
import { connecterGuard } from './guards/connecter-guard';

export const routes: Routes = [
    {
        path: "",
        loadComponent: () => import("./pages/connexion/connexion").then(x => x.ConnexionPage),
        title: "Connexion"
    },
    { 
        path: "personnage",
        loadComponent: () => import("./pages/personnage/personnagePage").then(x => x.PersonnagePage),
        title: "Personnage",
        canActivate: [connecterGuard]
    },
    { 
        path: "grade",
        loadComponent: () => import("./pages/grade/grade-page").then(x => x.GradePage),
        title: "Grade",
        canActivate: [connecterGuard]
    },
    { 
        path: "planete-origine",
        loadComponent: () => import("./pages/planete-origine/planete-origine").then(x => x.PlaneteOriginePage),
        title: "Planète d'origine",
        canActivate: [connecterGuard]
    },
    { 
        path: "specialite",
        loadComponent: () => import("./pages/specialite/specialite").then(x => x.SpecialitePage),
        title: "Specialité",
        canActivate: [connecterGuard]
    },
    { 
        path: "boutique",
        loadComponent: () => import("./pages/boutique/boutique").then(x => x.BoutiquePage),
        title: "Boutique",
        canActivate: [connecterGuard]
    },
    { 
        path: "gestion-boutique",
        loadComponent: () => import("./pages/gestion-boutique/gestion-boutique").then(x => x.GestionBoutiquePage),
        title: "Gestion de la boutique",
        canActivate: [connecterGuard]
    },
    { 
        path: "logistique",
        loadComponent: () => import("./pages/logistique/logistique").then(x => x.LogistiquePage),
        title: "Logistique",
        canActivate: [connecterGuard]
    },
    { 
        path: "materiel",
        loadComponent: () => import("./pages/materiel/materiel").then(x => x.MaterielPage),
        title: "Matériel",
        canActivate: [connecterGuard]
    },
    { 
        path: "vaisseau",
        loadComponent: () => import("./pages/vaisseau/vaisseau").then(x => x.VaisseauPage),
        title: "Vaisseau",
        canActivate: [connecterGuard]
    },
    { 
        path: "proposition-achat",
        loadComponent: () => import("./pages/proposition-achat/proposition-achat").then(x => x.PropositionAchatPage),
        title: "Proposition d'achat",
        canActivate: [connecterGuard]
    }
];
