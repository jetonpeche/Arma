import { TypeStockageLogistique } from "./Logistique"

export type Vaisseau =
{
    id: number,
    nom: string,
    prix: number,
    stock: number,
    role: string,
    nomFichier: string,
    bloquerAchat: boolean,
    listeArmement: VaisseauArmement[],
    listeStockage: VaisseauStockage[],
    listeVaisseauEnfant: VaisseauLeger[],
    vitesse: string,
    blindage: string,
    capaciteSpeciale: string | null,
    equipage: VaisseauEquipage
}

export type VaisseauLeger =
{
    id: number,
    nom: string
}

export type VaisseauArmement =
{
    id?: string,
    nom: string,
    information: string | null,
    nombre: number,
    nbTourReload: number
    munitionInfini: boolean,
    estUsageUnique: boolean,
    nbNombreReloadParNbTour: number
}

export type VaisseauStockage = 
{
    id: number,
    nom: string,
    taille: number,
    typeStockage: TypeStockageLogistique,
    contenuParDefaut: {
        idLogistique: number,
        quantite: number,
        nom: string
    }[]
}

export type VaisseauEquipage = 
{
    nbPlacePassager: number,
    nbPlaceMarines: number
}

export type VaisseauAchaterRequete =
{
    idVaisseau: number,
    nomVaisseau: string | null,
    nomCommandant: string | null,
    information: string | null
}

export type VaisseauRequete =
{
    nom: string,
    prix: number,
    role: string,
    vitesse: string,
    blindage: string,
    bloquerAchat: boolean,
    capaciteSpeciale: string | null,
    equipage: VaisseauEquipage,
    listeArmement: VaisseauArmement[],
    listeStockage: VaisseauStockageRequete[]
}

export type VaisseauStockageRequete = 
{
    id?: number,
    nom: string,
    taille: number,
    typeStockage: TypeStockageLogistique,
    contenuParDefaut: {
        idLogistique: number,
        quantite: number
    }[]
}
